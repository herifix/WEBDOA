# Database Versioning

- Keep all WEB DOA migrations in `Main/` and name them `yyyyMMddNN__description.sql`.
- Migration history is immutable: correct rollout behavior in a new versioned file.
- Every migration is single-batch and idempotent; do not use `GO`.
- Guard schema changes and seed data so a rerun preserves existing settings and data.
- When a same-batch statement depends on a newly added column or object, use dynamic SQL so SQL Server compiles it after the DDL.
- SQL files must be included in API build and publish output before relying on login-time execution.
