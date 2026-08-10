// Package migration exports the embedded base schema so that silo-cloud can
// run the OSS migrations before applying its own cloud-specific ones.
package migration

import "embed"

//go:embed *.sql
var FS embed.FS
