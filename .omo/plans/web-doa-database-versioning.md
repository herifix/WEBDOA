# web-doa-database-versioning - Work Plan

## TL;DR (For humans)
<!-- Fill this LAST, after the detailed plan below is written, so it summarizes the REAL plan. -->
<!-- Plain English for a non-engineer: NO file paths, NO todo numbers, NO wave/agent/tool names. -->

**What you'll get:** A tracked, automatic database migration system for WEB DOA. Schema changes will be applied once after a successful login and recorded in the database.

**Why this approach:** WEB DOA has one database, so it uses one migration catalog while retaining the proven locking, history, and failure behavior from WEB ERP.

**What it will NOT do:** It will not alter WhatsApp payloads, voice-storage behavior, or existing manual scripts. It will not run migrations at API startup.

**Effort:** Large
**Risk:** High - database schema and login availability change together.
**Decisions to sanity-check:** Login is the explicit migration trigger; the scheduler remains idle until that migration succeeds in the current process.

Your next move: implementation is approved. Full execution detail follows below.

---

> TL;DR (machine): Large/high-risk backend migration engine, runtime-DDL removal, login trigger, and scheduler readiness gate.

## Scope
### Must have
- Single-catalog SQL migrations under `API/DatabaseVersioning/Main`, copied to build and publish output.
- WEB ERP-style control tables, history, locking, single-batch validation, version-only replay, and per-step transactions for `WEB_DOA`.
- Login-triggered update before audit/token issuance; failures return HTTP 503 with the failed file/version context.
- Versioned replacement of all current runtime schema DDL and removal of those repository guards.
- Scheduler readiness gate that prevents dispatch before a successful login-time migration in this process.
### Must NOT have (guardrails, anti-slop, scope boundaries)
- Do not alter voice storage, MP3/MP4 conversion, WhatsApp payloads, send order, or WASent behavior.
- Do not edit existing `scripts/database/` files or unrelated dirty working-tree changes.
- Do not add Inventory/Tenant routing, a new public migration endpoint, or startup-time migration execution.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: tests-after; existing project has no test harness, so use isolated SQL Server and live HTTP smoke tests.
- Evidence: `.omo/evidence/web-doa-database-versioning-*.md`

## Execution strategy
### Parallel execution waves
Wave 1: core versioning/login/config; migration catalog/runtime-DDL removal.
Wave 2: scheduler readiness, build/publish, isolated-DB and HTTP verification.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | baseline read | 3, 4 | 2 |
| 2 | baseline read | 3, 4 | 1 |
| 3 | 1, 2 | 4 | none |
| 4 | 3 | final wave | none |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [ ] 1. Add the single-database versioning engine and login/configuration integration.
  What to do / Must NOT do: Implement `ProjectDatabaseVersionService` using the ERP runner contract adapted to `Main`; register it and process readiness; add `DatabaseVersioning` settings and SQL output/publish inclusion; invoke it after valid credentials but before `Addlog`/token, returning 503 on failure. Do not change successful login JSON.
  Parallelization: Wave 1 | Blocked by: baseline read | Blocks: 3, 4
  References (executor has NO interview context - be exhaustive): `D:/KANTOR/Project VB/WEB ERP/API/Service/ProjectDatabaseVersionService.cs`; `API/Controllers/LOGIN/AuthController.cs`; `API/Program.cs`; `API/API.csproj`; `API/appsettings*.json`.
  Acceptance criteria (agent-executable): `dotnet build API/API.csproj -c Debug -v:minimal`; published output contains `DatabaseVersioning/Main`.
  QA scenarios (name the exact tool + invocation): run API against isolated DB; `curl -i -X POST http://localhost:<port>/api/Auth/login -H 'Content-Type: application/json' -d '<valid JSON>'`; verify HTTP 200 and version rows; force a malformed temporary copied SQL file then verify 503 names file/version. Evidence `.omo/evidence/web-doa-database-versioning-engine.md`.
  Commit: N | feat(database): add login-time versioning engine

- [ ] 2. Create the numbered migration catalog and remove legacy repository schema guards.
  What to do / Must NOT do: Add baseline and idempotent current-schema migrations for `MsProg`, schedule/log, voice recordings, and TRBuletin; include current birthday offset. Remove `EnsureTable`/`EnsureTables`, column introspection, and service callers from the four repositories. Preserve repository business queries and do not modify `scripts/database/`.
  Parallelization: Wave 1 | Blocked by: baseline read | Blocks: 3, 4
  References (executor has NO interview context - be exhaustive): `API/Repository/Master/RepoApplicationSetting.cs`; `API/Repository/Master/RepoWhatsAppSchedule.cs`; `API/Repository/Transaction/RepoVoiceRecording.cs`; `API/Repository/Transaction/RepoTRBuletin.cs`; `API/Service/Transaction/ServiceTRBuletin.cs`.
  Acceptance criteria (agent-executable): `rg -n 'EnsureTable|EnsureTables|CREATE TABLE|ALTER TABLE|TryEnsureColumn' API/Repository/Master/RepoApplicationSetting.cs API/Repository/Master/RepoWhatsAppSchedule.cs API/Repository/Transaction/RepoVoiceRecording.cs API/Repository/Transaction/RepoTRBuletin.cs API/Service/Transaction/ServiceTRBuletin.cs` produces no results; migrations have no `GO` and conform to the version format.
  QA scenarios (name the exact tool + invocation): apply engine through valid login to isolated DB, query `sys.objects`, `sys.columns`, and existing setting rows to confirm all objects/columns/defaults and preservation. Evidence `.omo/evidence/web-doa-database-versioning-schema.md`.
  Commit: N | feat(database): version existing runtime schema

- [ ] 3. Gate scheduler dispatch on versioning readiness without changing WhatsApp behavior.
  What to do / Must NOT do: Make scheduler skip a cycle before the successful process-local login migration and operate unchanged afterward. Do not call migration from the scheduler or alter media/send paths.
  Parallelization: Wave 2 | Blocked by: 1, 2 | Blocks: 4
  References (executor has NO interview context - be exhaustive): `API/Service/Transaction/WhatsAppSchedulerWorker.cs`; root `AGENTS.md`; `API/Service/Transaction/ServiceTRBirthdayPray.cs`.
  Acceptance criteria (agent-executable): build passes and worker has no repository schema DDL path; readiness starts false for enabled versioning, becomes true only after successful login migration, and is immediately true if versioning is disabled.
  QA scenarios (name the exact tool + invocation): start API with an isolated DB and observe worker log skips before login; perform valid login; observe next cycle enters existing due-dispatch path without schema-create SQL. Evidence `.omo/evidence/web-doa-database-versioning-scheduler.md`.
  Commit: N | fix(scheduler): wait for database migration readiness

- [ ] 4. Verify build, publish, live login migrations, idempotent second login, and affected API surfaces.
  What to do / Must NOT do: Build and publish API; test migration success and controlled failure against isolated SQL Server; smoke affected endpoints after migration. Do not expose credentials or edit production settings.
  Parallelization: Wave 2 | Blocked by: 1, 2, 3 | Blocks: final wave
  References (executor has NO interview context - be exhaustive): `API/API.csproj`; `API/DatabaseVersioning/Main`; `API/Controllers/LOGIN/AuthController.cs`; `API/Controllers/Master/*`; `API/Controllers/Transaction/*`.
  Acceptance criteria (agent-executable): build and publish exit 0; output includes both SQL files; first valid login reaches target version, second login creates no additional execution logs, malformed migration yields 503; Master Setting, TRBuletin, voice recording, schedule, and dashboard calls succeed on migrated schema.
  QA scenarios (name the exact tool + invocation): run published API and use `curl -i` GET/POST requests with a valid login bearer token; query version/log tables through a temporary non-secret SQL client command. Evidence `.omo/evidence/web-doa-database-versioning-verification.md`.
  Commit: N | test(database): verify migration rollout

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit
- [ ] F2. Code quality and security review
- [ ] F3. Real HTTP/database manual QA
- [ ] F4. Scope fidelity and dirty-worktree audit

## Commit strategy
No commit unless the user asks; preserve existing dirty changes.

## Success criteria
- Valid login applies `WEB_DOA` migrations from `Main` exactly once and failures block token issuance with actionable 503 context.
- All legacy runtime DDL in the four named repositories is represented in migration SQL and removed from runtime code.
- Scheduler never dispatches before readiness and preserves existing behavior after readiness.
- Build/publish output contains migrations; isolated database and real endpoint smoke checks pass.
