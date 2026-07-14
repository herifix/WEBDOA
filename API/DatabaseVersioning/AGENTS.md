# Database Versioning

- Keep all WEB DOA migrations in `Main/` and name them `yyyyMMddNN__description.sql`.
- Migration history is immutable: correct rollout behavior in a new versioned file.
- Every migration is single-batch and idempotent; do not use `GO`.
- Guard schema changes and seed data so a rerun preserves existing settings and data.
- When a same-batch statement depends on a newly added column or object, use dynamic SQL so SQL Server compiles it after the DDL.
- SQL files must be included in API build and publish output before relying on login-time execution.

## Application Change Requirement

- Whenever an application change requires a database change, create the matching new versioned SQL migration in the same task. This includes schema changes, required seed/default/configuration data, lookup data, and database routines used by the changed application flow.
- Do not rely on manual database edits or a standalone SQL script as the delivery path. The versioned migration under `Main/` is part of the application change and must be ready for the database-versioning system to execute.
- Use a new next-version file even when correcting a prior rollout; never amend an existing migration that may already have run.
- Verify the migration is idempotent, single-batch, and present in the API build/publish output before completing an application change that depends on it.
