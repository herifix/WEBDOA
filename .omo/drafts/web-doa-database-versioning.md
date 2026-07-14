---
slug: web-doa-database-versioning
status: active
intent: clear
pending-action: execute approved user plan
approach: Single database versioning catalog, login trigger, runtime-DDL migration, and scheduler readiness.
---

# Draft: web-doa-database-versioning

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->
| engine | Versioned SQL loader and control objects | active | API/Service/ProjectDatabaseVersionService.cs |
| schema | Existing dynamic DDL moved to Main migrations | active | API/DatabaseVersioning/Main |
| trigger | Login runs migration before audit/token | active | API/Controllers/LOGIN/AuthController.cs |
| scheduler | Dispatch waits for version readiness | active | API/Service/Transaction/WhatsAppSchedulerWorker.cs |

## Open assumptions (announced defaults)
<!-- Record any default you adopt instead of asking, so the user can veto it at the gate. -->
<!-- assumption | adopted default | rationale | reversible? -->
| migration target | DefaultConnection single database | WEB DOA has no tenant resolver | no |
| execution trigger | valid login only | user selected login-time execution | no |
| legacy DDL | migrate all four runtime guards | user selected single source of schema | no |

## Findings (cited - path:lines)
 - WEB DOA schema DDL currently lives in four repositories and TRBuletin service calls; scheduler starts before any login.
 - WEB ERP provides the control-table, locking, source definition, and version-only model being adapted.

## Decisions (with rationale)
 - Use `Main` instead of ERP Inventory/Tenant because DOA has one target DB.
 - Do not start migration in scheduler; it waits for the login trigger to preserve the user's chosen trigger.

## Scope IN
 - Runner, migrations, login/config/output integration, runtime-DDL removal, scheduler readiness, scoped rules, verification.

## Scope OUT (Must NOT have)
 - Voice/media/WhatsApp business flow changes, scripts/database edits, public migration endpoints, startup migration.

## Open questions

## Approval gate
status: approved-by-user
<!-- When exploration is exhausted and unknowns are answered, set status: awaiting-approval. -->
<!-- That durable record is the loop guard: on a later turn read it and resume at the gate instead of re-running exploration. -->
