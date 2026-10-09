// Package scheduler runs periodic background jobs in-process.
//
// The API can run as more than one replica, so a plain time.Ticker would fire
// the same job once per replica. Each job run is wrapped in a Postgres
// session-scoped advisory lock (pg_try_advisory_xact_lock): only the replica
// that acquires the lock executes the job, the rest skip that tick. The lock
// is held for the lifetime of one database transaction and released
// automatically on commit/rollback, so a crashed replica can never leave it
// stuck.
package scheduler

import (
	"context"
	"hash/fnv"

	"github.com/robfig/cron/v3"
	"gorm.io/gorm"

	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
)

// Job is a unit of scheduled work. ctx carries a fresh request-scoped logger,
// not an inbound HTTP context.
type Job func(ctx context.Context) error

// Scheduler owns a set of registered jobs and the cron loop that fires them.
type Scheduler struct {
	cron *cron.Cron
	db   *gorm.DB
}

// New returns a Scheduler. db is used only to take the advisory lock —
// jobs are otherwise free to use their own store/service calls as usual.
func New(db *gorm.DB) *Scheduler {
	return &Scheduler{
		cron: cron.New(),
		db:   db,
	}
}

// Register schedules job to run on spec, a standard 5-field cron expression
// or a "@every 15m"-style descriptor (see robfig/cron docs). name must be
// unique across all registered jobs — it seeds the advisory lock key that
// keeps concurrent replicas from double-running this job.
func (s *Scheduler) Register(name, spec string, job Job) error {
	lockKey := lockKeyFor(name)
	_, err := s.cron.AddFunc(spec, func() {
		s.runLocked(context.Background(), name, lockKey, job)
	})
	return err
}

// Start begins running scheduled jobs in a background goroutine. Non-blocking.
func (s *Scheduler) Start() { s.cron.Start() }

// Stop halts the scheduler and blocks until any in-flight job finishes.
func (s *Scheduler) Stop() { <-s.cron.Stop().Done() }

// runLocked tries to acquire the job's advisory lock and, on success, runs it.
// A replica that loses the race logs and skips — the next tick will retry.
func (s *Scheduler) runLocked(ctx context.Context, name string, lockKey int64, job Job) {
	log := siloLogger.New().With().Str("job", name).Logger()
	ctx = siloLogger.InjectInCtx(ctx, log)

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var acquired bool
		if err := tx.Raw("SELECT pg_try_advisory_xact_lock(?)", lockKey).Scan(&acquired).Error; err != nil {
			return err
		}
		if !acquired {
			log.Debug().Msg("another replica holds the lock for this tick, skipping")
			return nil
		}

		log.Info().Msg("running scheduled job")
		return job(ctx)
	})
	if err != nil {
		log.Error().Err(err).Msg("scheduled job failed")
	}
}

// lockKeyFor derives a stable int64 advisory lock key from a job name.
// pg_try_advisory_xact_lock takes a signed bigint — a negative hash is fine,
// Postgres treats the full int64 range as valid lock key space.
func lockKeyFor(name string) int64 {
	h := fnv.New64a()
	_, _ = h.Write([]byte(name))
	return int64(h.Sum64())
}
