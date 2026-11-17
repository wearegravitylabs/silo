# Plan: FE feedback (Nov 2026)

This plan answers the frontend list item by item. Every item says which repo the work belongs in:

- **silo**: the open-source API (`silo/api`). It holds everything a self-hoster gets.
- **cloud**: the paid service (`silo-cloud/api`). It holds AI chat, billing, plan limits, Google/Apple sign-in, and anything else we only run for paying users.

**How the two repos connect today:** silo-cloud imports silo at the tag `api/v0.1.0`; there is no `replace` line any more. A silo fix therefore reaches cloud only after three steps:

1. Tag silo again (`api/v0.2.0`, …).
2. Bump the version in cloud's `go.mod`.
3. Build both repos.

Each phase below ends with that tag and bump.

**Important for the FE engineer:** some of the things on the list already exist, but only in silo-cloud. That covers AI chat, saved threads, the AI creating assets, subscriptions and the billing portal. The frontend must call the cloud API for those. Cloud serves every silo route too, so the frontend can use one base URL: the cloud one.

---

## Phase 0: Fix what is broken (silo)

> **Status (2026-11-17): done in silo, not yet committed.** Every item below is fixed and checked
> against a real database with an end-to-end script (28/28 pass). While doing this we also found and
> fixed a bigger problem: **ids in the URL were never checked against the portfolio in the URL**, so
> a member of one portfolio could read or change another portfolio's assets, debts, rules, projections,
> folders and documents by id. Every route now checks this and answers `404 NOT_FOUND`.
> Other extras: new debts defaulted to USD instead of the portfolio's currency, an autopilot rule could
> target another portfolio's asset, and the snapshot and insight routes had no membership check. All fixed.
>
> **To do in silo-cloud when it moves to the new silo tag (`api/v0.2.0`):**
> 1. Register the two new jobs in cloud's `main.go`: `snapshot-capture` and `purge-deleted-accounts`.
> 2. Set `dp.OnAccountDeleted` to cancel the Stripe subscription and delete the user's `oauth_accounts`
>    rows. Otherwise Google sign-in would find the deleted account, and a deleted user would keep being
>    billed.
> 3. Cloud's own tables (subscriptions, usage, chat) have no foreign key to `users`. Clean them up in
>    that hook, or in a cloud purge job.
> 4. Rebuild: `Asset.FolderID` is now a pointer, and `UpdateAssetRequest.FolderID` is now
>    `Optional[uuid.UUID]`. Cloud's chat actions use `UpdateAssetRequest`.
> 5. Set `STORAGE_PUBLIC_ENDPOINT` in an environment where `STORAGE_ENDPOINT` is an internal address.
>
> **Once, after deploy:** run `go run ./cmd/fix-content-types` from `api/` so files uploaded earlier get
> the right type.

These are bugs, not missing features. I checked each one in the code, and the cause is listed.

| # | Problem | Cause | Fix |
|---|---|---|---|
| 0.1 | Creating an autopilot rule returns 500 (`rule_type` is null) | The `autopilot_rules` table still has a `rule_type NOT NULL` column from the first schema. The Go model no longer has that field. | Add a migration that drops the column, or gives it a default. |
| 0.2 | Value history returns 500, and the dashboard chart, net-worth change and top movers are empty | The table is called `asset_value_history`. GORM guesses the name `asset_value_histories`, because the model has no `TableName()`. Every write has been failing, so there is no history at all. | Add `TableName()`. Then fill in one starting point per asset from its current value, so charts are not empty on day one. |
| 0.3 | Projection `/compute` and `/chart` return 404 `PORTFOLIO_NOT_FOUND` for the owner | `Compute` loads the portfolio with an empty user id (`uuid.Nil`), and the member check fails. | Load the portfolio without the member check; the route's middleware already did that check. |
| 0.4 | Adding, updating or deleting a projection rule saves, but returns 404 and the projection result | It calls the same `Compute` as 0.3, and it returns the result instead of the rule. | Return the rule (or `204` on delete). Fixing 0.3 removes the 404. |
| 0.5 | `GET /debts?folder_id=` returns 400 | The filter field is `*uuid.UUID`, and Gin can't fill it from the query string. | Read it as a string and parse it, the same way the assets filter does. |
| 0.6 | Download links point to `http://minio:9000/…` | Presigned links are signed with the internal storage address. The MinIO adapter's `PresignedURL` is not written at all. | Add a `STORAGE_PUBLIC_ENDPOINT` setting and sign links with it. Finish or remove the MinIO adapter. |
| 0.7 | Uploaded images download instead of opening | `/upload` detects the file type but never passes it to storage, so S3 stores `application/octet-stream`. | Pass `ContentType` on upload. Add a one-off script to fix the type on files already uploaded. |
| 0.8 | PATCH ignores `null`, so nothing can be cleared | Request structs use plain pointers, so "sent null" and "not sent" look the same. | Add a small "optional field" type that can tell the two apart. Use it for every field that can be cleared: `folder_id`, `avatar_url`, `image_url`, `notes`, dates. |
| 0.9 | `DELETE /users/me` leaves the user's portfolios, and signing up again makes a new account | It only soft-deletes the user row. | **Decided:** soft-delete the user and the portfolios they own. Add `-deleted` to the email, phone and any other unique field so they can sign up again fresh. Remove the user from portfolios others share with them. Skip deleted users in every cron job (autopilot, price refresh, snapshots, insights). A daily job deletes the data for good after **30 days**; support can restore an account before then. The emailed code comes in Phase 4. |
| 0.10 | Snapshots are always empty | Nothing ever creates a snapshot. | Add a daily snapshot job to the scheduler. The scheduler already runs autopilot, FX and stocks, and this needs wiring in cloud too. |
| 0.11 | `/insights/*` crash | They are stub handlers that panic. | In silo, return a clean `501 NOT_AVAILABLE`. The real insights are an AI feature, so they are built in cloud (Phase 7). |
| 0.12 | Profile photos after the "stop setting public-read ACL" commit | Checked: photos are fine. The public bucket gets a public-read **bucket policy** at boot, and the commit was tested on MinIO (public object returns 200, private returns 403). | No code change. Add a line to the deployment docs: on R2 or S3, public access must be turned on for the public bucket. |

---

## Phase 1: Make every amount right (silo)

> **Status (2026-11-17): done in silo, not yet committed.** Checked against a real database with USD, NGN
> and GBP holdings (45/45 pass, and the Phase 0 check still passes 28/28).
>
> **How it behaves:**
> - **Exchange rates:** only today's rates are kept, so past values are converted at today's rate.
> - **Gain:** the price gain only (value − cost of lots). Cash flows are not included.
> - **New items:** an asset or debt added to Silo in the last 30 days has no 1-month change, and doesn't
>   appear in top movers. Its only older value is the purchase price, so a "this month" change would be wrong.
>
> **Not done here:** `needs_attention` (left out on purpose).
>
> **Found and fixed on the way:**
> - The amortization schedule put today's balance on dates counted from the loan's original start date.
> - `biannual` payments were treated as monthly.
> - A manual asset created with several lots saved wrong history values. A migration corrects them.
>
> **silo-cloud when it moves to the next tag:**
> - `Asset` and `Debt` services have new methods (`Sell`, `Overview`, `ListBalanceHistory`).
> - `Dashboard.Get` takes an optional `Options`. The chat tool's call `Get(ctx, p, u, "1M")` still compiles.
> - Cloud's `main.go` needs no new wiring for this phase.

Most of the dashboard, asset and debt items share one root cause: **nothing is converted to the portfolio's base currency.** The `exchange_rates` table and the daily FX refresh already exist. We add one helper that converts an amount from one currency to another on a given date, and then use it everywhere.

**Dashboard**
- Convert totals, allocation and movers to the base currency.
- Periods: `1D, 1M, 3M, YTD, 1Y, ALL`. An unknown period returns `400`; today it quietly falls back to 1M.
- Net-worth breakdown by currency.
- Allocation by type, by currency and by folder, on top of the class breakdown we have now.
- Top movers: show each asset's currency, and add a `window` parameter (`today`, `week`, `month`).
- Debt summary:
  - total, scheduled total and unscheduled total
  - monthly payments
  - interest paid this year
  - debt-free date

**Assets**
- `change_pct_1m`. **`needs_attention` is left out for now:** the FE may work it out from `updated_at`. If they want "value not updated in X days", add a `value_updated_at` field, because `updated_at` also changes on a rename or folder move.
- `invested`, `gain` and `gain_pct` on each asset. This was planned before, as cost basis and gain.
- Value history:
  - in the base currency
  - for the owned share only
  - with the change from the previous point
- Partial sell: `POST /assets/:id/sell` with units, date and price. It reduces lots oldest first and records the money that came in.
- Price updates can carry a date.
- Value updates can be sent as "owned value in base currency" (what the user types). The API works out the price per unit.

**Debts**
- Debts overview: total and 1M change.
- A new `debt_balance_history` table. Repayments and adjustments add a dated row instead of overwriting the balance.
- Icon and `metadata` fields on debts.
- `change_pct_1m`, `is_scheduled`, `monthly_payment` and `interest_rate` in the debt list.
- Balance updates can be sent as the owned balance.

---

## Phase 2: Rebuild the projections engine (silo)

The problems are all in one engine, so it is cleaner to rewrite the monthly loop than to patch it piece by piece.

**Wrong maths**
- Frequency: turn every rate into the right monthly step. 6% a year becomes about 0.487% a month, compounded. A $60k yearly salary becomes $5k a month. $500 a month stays $500 a month.

**Rules apply too widely**
- Asset-type growth must only touch matching assets.
- Single-asset growth, debt interest and management fees must only touch their target.
- Add category growth for investable assets, stocks, non-investable assets and debts.

**Starting values**
- Starting values are converted to the base currency (uses Phase 1).

**Cash**
- Add a separate **cash** line: income goes in and expenses come out, and debt payments are taken from cash. This is what "Net Worth + Cash" needs. **Decided:** cash can go below 0, so the shortfall shows, and the chart can colour it red.

**Goals**
- "Debt free" and "target value" goals move toward the target a little each month instead of jumping.

**Income**
- Employment income runs "until age". This needs the user's date of birth on the profile (Phase 4).

**Chart**
- `/chart` always returns monthly points.
- `/chart` also returns the change from today, as an amount and a %.

**Scenarios and rules**
- Rule routes must check that the rule belongs to the scenario in the URL.
- Scenarios get a `colour` field and an `intro_seen` flag.
- A default scenario is created with each new portfolio. Existing portfolios get one through a migration.

**Export**
- The frontend can draw the PDF or JPEG itself from `/chart`. We only build an API export if they need it.

Tests: a table of known cases, one per rule and frequency, with numbers worked out by hand.

---

## Phase 3: Smaller API gaps (silo)

- Autopilot:
  - `PATCH /autopilot/rules/:id`
  - `GET /autopilot/rules?target_id=` to list one asset's or debt's rules
- Notes: accept `tags` as a plain array. Keep reading the old `{ "list": [...] }` shape so old data still works.
- Folders: a `colour` field.
- Exports: CSV for assets and debts (`GET /assets/export`, `GET /debts/export`).
- Real-estate address search: the frontend calls Google Places directly with a browser key. No API work.

---

## Phase 4: Account and security (silo, with cloud parts)

- `POST /auth/logout` revokes the refresh token. This needs a refresh-token table or deny-list; today tokens can't be revoked.
- An emailed code for risky actions. One reusable "send code / check code" flow, used for:
  - deleting the account
  - deleting a portfolio
  - changing the vault password
- Change email:
  - check whether the new email is taken
  - send a link
  - confirm the change
- Settings saved on the user. One `settings` JSON column, read and written through `/users/me/settings`:
  - preferences: theme, accent colour, language
  - notification settings: email, in-app
  - security settings: invited viewers must sign up
- Date of birth on the profile (for projections).
- Delete the old file from storage when the profile photo is removed or changed.
- **cloud:** add `plan`, `trial_ends_at` and `trial_days_left` to `GET /users/me`. Cloud already has this in its subscription service, so it only needs exposing.

---

## Phase 5: Sharing and invites (silo)

**Decided:** keep the API roles `owner / editor / viewer`. The app shows **"Partner" for `editor`**. No database change.

Work:
- Members:
  - a `status` field (`invited`, `active`) and `joined_at`
  - change a member's role
  - resend an invite
- Section access: which sections a member can see (dashboard, insights, assets, debts, vault, projections). It is stored per member and checked in middleware.
- Invite link: create the link, open an invite, accept it, and request access for the owner to approve.
- Leave a portfolio: `DELETE /portfolios/:id/members/me`. Anyone except the owner can do it.
- A public read-only share link for a portfolio, using a random token. It can be turned off at any time.
- **cloud:** seat limits already exist (`CheckSeatLimit`). Run them on invite accept, not just on "add member".

---

## Phase 6: Vault password and encryption (silo)

**Decided:** only the user holds the key. The server stores a locked copy of the key that it can't open, so even we can't read vault files.

What this means:
- A forgotten vault password means the files are lost. The app must say this clearly when the password is set.
- Changing the password needs the **old** password, because the browser must unlock the key before it can lock it again with the new one. The emailed code is an extra check on top, not a way to reset.

The details still need agreeing with the FE, because the browser does the encrypting.

- The browser makes a random file key and wraps it with a key made from the vault password (PBKDF2 or Argon2 plus a salt).
- The server only stores the wrapped key, the salt, and a check value. It never sees the password or the plain key.
- Endpoints:
  - `GET /vault/status`: is a password set? is the vault locked?
  - `POST /vault/password`: set the password
  - `POST /vault/unlock`: returns the wrapped key and salt
  - `POST /vault/password/change`: needs the emailed code, re-wraps the key
- Vault settings: an auto-lock time, saved in the user settings from Phase 4.
- Until this ships, files stay unencrypted. Files uploaded before it need a way to be encrypted later.

---

## Phase 7: Silo AI (cloud)

**Already built in silo-cloud** (built and tested, but never run against the live API):
- `POST /portfolios/:id/chat/messages`: a streamed reply over SSE, with `text`, `tool_use`, `status`, `confirm_required`, `done` and `error` events.
- `GET /portfolios/:id/chat/threads`: the list of saved chats.
- The AI proposes changes and the user approves them. There are five write tools, including **create asset**:
  - the AI asks follow-up questions
  - it stores a pending action
  - the frontend shows a preview card
  - the user confirms or rejects it at `/chat/actions/:id/confirm|reject`
- Monthly AI message limits per plan.

**Still to do in cloud**
- Load one chat: `GET /chat/threads/:id` with its messages. Tool rows are shown as small chips, not empty bubbles.
- Rename or delete a chat.
- Fix the thread order: `updated_at` is never updated.
- Status events: send `status` events ("thinking", "executing <tool>", "processing") and short reasoning steps.
- Stop and retry:
  - Stop: the frontend closes the stream, and the server notices and saves what it has.
  - Retry: `POST /chat/messages/:id/retry` runs the last user message again.
- @mentions: `context: ["assets","debts","vault"]` on the message. It narrows which tools and data the AI uses.
- Suggested questions are ordinary chat messages. They need no endpoint of their own.
- Daily insights: a daily job asks the AI for a few insights per portfolio and stores them as title, sections and highlighted figures. `GET /insights/daily` in cloud reads the latest.
- A cleanup job for expired pending actions.

---

## Phase 8: Billing (cloud)

**Already built:**
- `GET /billing/subscription`
- `POST /billing/checkout`
- `POST /billing/cancel`
- `GET /billing/portal` (Stripe's own billing page)
- the Stripe webhook

**Decided:** use **Stripe's billing page** (`GET /billing/portal`) for invoices, invoice PDFs, paying an invoice and changing the billing cycle. We build no invoice endpoints of our own. Ending a trial early means upgrading through `POST /billing/checkout`. The FE needs:
- a "Manage billing" button that opens the portal link
- the plan and trial fields on `/users/me` (Phase 4)

Still to check: the Stripe portal must be set up in the Stripe dashboard to allow switching between monthly and yearly.

The trial-ending and trial-expired emails are also still to do (already on the open list).

---

## Phase 9: Later, needs outside services

- **Crypto prices.** A CoinGecko client exists. Wiring it in unblocks:
  - adding crypto tickers
  - crypto DCA in autopilot
  
  It needs a caching rule like the stocks one, so we don't burn the free quota.
- **Bank (Plaid) and crypto exchange/wallet connections.** These are large pieces of work, probably cloud-only. They stay "Coming soon".

---

## Suggested order

1. **Phase 0.** It unblocks the frontend at once and is mostly small fixes. Then tag `api/v0.2.0` and bump cloud.
2. **Phase 1, then Phase 2.** Projections depend on the currency helper.
3. **Phase 7 "still to do", in parallel.** It is all in cloud, so it doesn't clash with silo work.
4. **Phases 3 and 4.**
5. **Phases 5 and 6.** Each needs a short design talk with the FE first.
6. **Phase 8,** once the Stripe question is decided.
7. **Phase 9.**

## Decisions (made 2026-11-17)

1. **Deleting an account:** soft-delete the user and their portfolios. Add `-deleted` to the unique fields, stop the cron jobs for them, and delete everything for good after 30 days. (0.9)
2. **Needs attention:** left out for now. The FE may use `updated_at`. (Phase 1)
3. **Projected cash:** can go below 0. (Phase 2)
4. **Roles:** the app shows "Partner" for `editor`. No API change. (Phase 5)
5. **Billing:** Stripe's billing page. No invoice endpoints of our own. (Phase 8)
6. **Vault key:** only the user holds it, and a forgotten password means lost files. The details still need agreeing with the FE. (Phase 6)
