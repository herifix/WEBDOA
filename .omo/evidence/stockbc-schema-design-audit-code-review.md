# StockBC Schema Design Audit Code Review

## Scope And Evidence

Reviewed only the requested anchors that were available:
- `D:/KANTOR/Project VB/WEB ERP/docs/module-agents/StockBC/AGENTS.md`
- `D:/KANTOR/Project VB/WEB ERP/docs/module-agents/StockBC/MigrationBlueprint.md`
- `D:/KANTOR/Project VB/WEB ERP/API/DatabaseVersioning/Tenant/2026070801__OrderSubconTables.sql`
- `D:/KANTOR/Project VB/WEB ERP/API/Repository/Transaction/Subcon/RepoTRSubconAJU.cs`
- `D:/KANTOR/Project VB/WEB ERP/API/Service/Transaction/Subcon/ServiceTRSubconAJU.cs`
- `D:/KANTOR/Project VB/WEB ERP/API/Repository/Transaction/RepoHistoryStock.cs`
- `D:/KANTOR/Project VB/WEB ERP/API/Repository/global/RequestModel.cs`
- `D:/KANTOR/Project VB/ProjectGKI/SQL/GKI/HITBCSJJual_MERGE Prioritas FIFO Lama.sql`
- `D:/KANTOR/Project VB/ProjectGKI/SQL/GKI/Index BuildBC Per SJ.sql`

No full diff, changed-file list, test report, or runtime evidence was supplied. This is a read-only schema design audit, not an approval of implementation parity.

## Skill Perspective Check

- `remove-ai-slops`: consulted by loading `SKILL.md`. No tests were provided, so test overfit/slop review is N/A. Production/schema review applied the slop criteria for needless complexity, hidden maintenance burden, deletion-only/tautological tests, and unnecessary extraction/parsing. No test slop was found because no tests were in scope.
- `programming`: consulted by loading `SKILL.md`. Language-specific references were not applicable because the reviewed implementation files are C# and SQL, outside the skill's listed language gates. The shared perspective was applied: typed/stable source refs, parse/validate at boundaries, no untyped escape hatches, no needless generic abstraction, and maintainability.
- Perspective result: the proposed direction does not violate the skills if it remains branch-separated and source-ref-first. The reviewed current anchors show high-risk gaps: missing Sales/SJ schema, missing batch/lock/audit concepts, and under-modeled provenance/price trace in Subcon.

## CRITICAL

1. Sales/SJ cannot be considered migrated by the reviewed schema.

   The current reviewed migration creates only `TRSubcon...` objects (`2026070801__OrderSubconTables.sql:175-298`). The blueprint explicitly says Sales/SJ still needs equivalents for `SJXBC`, `SJXBCDetail`, `SJBCBOM`, `BuildXBCSJLock`, Sales allocator, Sales report/export, and `HiAKT02` debit-source reference design (`MigrationBlueprint.md:315-321`, `:359-370`, `:516-522`). ProjectGKI proves these are required runtime state, not optional report tables: demand comes from `SJXBC` (`HITBCSJJual_MERGE Prioritas FIFO Lama.sql:123-165`), allocations are saved to `SJXBCDetail` (`:661-691`), stock credits are written to `Hiakt02FIFO` with `IDUrut_Ref` (`:696-738`), and shortage rows are saved with blank BC fields (`:743-788`). The supporting ProjectGKI schema/index anchor defines the Sales lock, BOM snapshot, tree link, detail, and FIFO indexes (`Index BuildBC Per SJ.sql:4-18`, `:21-51`, `:108-145`, `:148-181`).

   Compatibility impact: without these Sales/SJ objects and a debit-source link, WEB ERP cannot preserve old allocation, allocate FIFO by debit row, show Sales shortage, or balance Sales stock credits like ProjectGKI.

   Required before approval: add/version the Sales/SJ demand/tree snapshot, allocation detail, BOM snapshot, lock/build-batch, shortage markers, old-preserved marker, allocation sequence, and explicit stock-credit debit-source reference. Do not treat the existing BC reports or generic `HiAKT02` as sufficient.

## HIGH

1. `HiAKT02` is not yet compatible with ProjectGKI `Hiakt02FIFO` Sales source links.

   `RequestCreateHiAKT02` only carries generic stock fields: document, stock date, warehouse, item, qty, price, note, form/detail/type (`RequestModel.cs:1219-1230`). `RepoHistoryStock` inserts only those fields into `HiAKT02` (`RepoHistoryStock.cs:139-145`) and the bulk save path does the same (`RepoHistoryStock.cs:51-56`). ProjectGKI Sales credits require `IDUrut_Ref = debit IdUrut`, `SourceModul='SJJUAL'`, and source row ids (`HITBCSJJual_MERGE Prioritas FIFO Lama.sql:696-738`). The blueprint warns that `HiAKT02` is only partial parity and still needs explicit source-link design (`MigrationBlueprint.md:319`, `:368-370`, `:591-596`).

   Required before approval: design either BC-specific ledger columns/tables or a separate Sales allocation ledger that can link every credit to its debit source id and demand row. Generic `id_detail_tr_ref` is not enough.

2. Subcon schema lacks the build batch, lock, and audit model that the blueprint makes a design requirement.

   The target design requires a `build_batch_id` with branch, document, PT, area, user, timestamps, status, message, and source snapshot checksum, with allocation/shortage/trace rows pointing to it (`MigrationBlueprint.md:113-117`, `:428-464`). Current `TRSubconAJU` only has `build_status`, `last_build_date`, and `last_build_message` (`2026070801__OrderSubconTables.sql:17-19`). The Subcon allocation tables have no `build_batch_id` or lock owner fields (`2026070801__OrderSubconTables.sql:177-184`, `:198-225`, `:239-266`, `:278-293`). Rebuild deletes all current order allocation rows before rebuilding (`ServiceTRSubconAJU.cs:468-477`; `RepoTRSubconAJU.cs:1293-1298`).

   Required before approval: add a shared StockBC build batch/lock/audit schema and batch refs on all Subcon allocation, shortage, WIP, KOP, and item-on-subcon rows. Transaction rollback helps, but it does not provide rebuild history, stale-lock review, batch-scoped cleanup, or source snapshot audit.

3. Subcon stock pools are not partitioned by area/warehouse, even though legacy and target design require it.

   StockBC rules call out area-specific behavior: legacy `BuildStokBC` calls `InsertSaldoBCSubcon LastHitDate, Area` (`AGENTS.md:143`) and debit rows carry area-sensitive source data (`AGENTS.md:165-173`). The blueprint requires PT/area on demand snapshots and indexes (`MigrationBlueprint.md:435-442`, `:479-482`). Current Subcon stock and WIP tables have `id_pt` but no area/warehouse partition columns (`2026070801__OrderSubconTables.sql:198-225`, `:239-266`, `:278-293`). Runtime pool queries filter by `id_pt`, item, status, and date only (`RepoTRSubconAJU.cs:1458-1503`), and prior-output supply also filters by `id_pt` only (`RepoTRSubconAJU.cs:1546-1550`).

   Required before approval: add the WEB ERP equivalent of `Kode_Area`/warehouse/source location to Subcon BC pool, WIP usage, batch, and indexes, or document a proven tenant model where `id_pt` fully replaces area. Without that proof, cross-area allocation is a compatibility risk.

4. Price provenance is under-modeled for Subcon parity.

   The blueprint requires saved qty, source price, computed price, source refs, formula category, and explain rows for auditable price calculation (`MigrationBlueprint.md:138-141`, `:305-309`). Current schema stores only single price/harga values: `TRSubconAJURM.harga` (`2026070801__OrderSubconTables.sql:144`), `TRSubconStokBC.price` (`:212`), `TRSubconStokBCKOP.price` (`:253`), `TRSubconAJURMBCUsed.price` (`:287`), and `TRSubconAJUItemOnSubconBC.price` (`:184`). The service recalculates by summing saved rows at rebuild time (`ServiceTRSubconAJU.cs:983-1055`) but does not persist the formula category or price-source breakdown.

   Required before approval: add explicit price trace data, either as trace rows or columns, so normal, KOP, WIP-from-other-subcon, substitution, and item-on-subcon reuse can explain source cost and computed cost without re-deriving from loose joins.

5. `TRSubconAJUItemOnSubconBC` is too thin for the proposed "harden with provenance/price trace" direction.

   The table stores only header id, item-on-subcon ref, optional main-stock ref, qty, and price (`2026070801__OrderSubconTables.sql:177-184`), and the insert path writes only those fields (`RepoTRSubconAJU.cs:1597-1604`). The StockBC notes say reusable/on-subcon pricing must come from saved source refs, and saved BC provenance is the source of truth for routing (`AGENTS.md:233-235`, `:353`). Current rows cannot independently preserve source table/id/doc/line, BC no/type/date, shortage reason/type, batch id, or route metadata.

   Required before approval: extend item-on-subcon BC rows with batch id, PT/area, source table/id/doc/line, BC fields, shortage marker/type, note, and price trace fields, or add a shared trace table that covers them.

## MEDIUM

1. Critical source refs and row states are mostly enforced by service code, not schema.

   `TRSubconAJUSub` has a header FK (`2026070801__OrderSubconTables.sql:65-67`), but `TRSubconStokBC`, `TRSubconStokBCKOP`, and `TRSubconAJURMBCUsed` do not define FKs after their table definitions (`:226-233`, `:267-272`, `:293-298`). `TRSubconAJUItemOnSubconBC` only FKs to the header (`:187-189`), not to the item-on-subcon row or source stock row. Deletion safety is currently implemented by manual reference counting (`RepoTRSubconAJU.cs:1269-1290`).

   Risk: orphaned allocation rows, invalid `STS` values, positive source ids on shortage rows, or missing debit refs can be inserted outside the service path. Add check constraints and FKs where possible; where polymorphic refs prevent FKs, add validation procedures and filtered indexes.

2. Subcon debit source coverage is not compatible with the documented legacy source set yet.

   Legacy/blueprint Subcon debit refresh recognizes LPB/BMB/262 and related sources (`AGENTS.md:165-173`; `MigrationBlueprint.md:265-270`). Current WEB ERP seed code only reads `TRGR`, `TRGRSub`, and `TRPOSub` (`RepoTRSubconAJU.cs:1315-1365`) and inserts those as `source_table='TRGRSub'` (`RepoTRSubconAJU.cs:1399-1405`). The generic `source_table/source_id` columns can support more sources, but the migration/seed design is not yet a proven equivalent of `InsertSaldoBCSubcon`.

   Required: define the complete source-type matrix and source-specific uniqueness/index rules before treating Subcon debit refresh as compatible.

3. KOP mirror provenance is ambiguous.

   When `header.is_kop` is true, consuming main pool rows creates `TRSubconStokBCKOP` debit mirror rows with `source_table='TRSubconAJU'`, `source_id=header.id_trsubcon_aju`, blank BC fields, and `id_trsubcon_stokbc_ref = null` (`ServiceTRSubconAJU.cs:823-853`). That loses the direct link from the mirror row back to the consumed main debit row, even though source-ref-first tracing is a stated design rule (`MigrationBlueprint.md:122-127`, `:471-474`).

   Required: store the mirror's originating main debit row id/source BC fields, or define a separate mirror-source ref so KOP trace and price proof do not depend on indirect reconstruction.

4. Shortage date semantics need an explicit compatibility decision.

   StockBC rules say Subcon shortage/blank BC rows use blank BC fields, `TglBC = 1900-01-01`, and source id `0` (`AGENTS.md:226-228`). Current Subcon schema allows nullable `tgl_bc` (`2026070801__OrderSubconTables.sql:222`, `:263`), and current normal shortage insert writes `tgl_bc = null` with `is_shortage = true` (`ServiceTRSubconAJU.cs:735-765`). This may be a valid WEB ERP improvement, but report/export compatibility must normalize it intentionally.

   Required: either use the legacy sentinel consistently for compatibility, or document/report-map `NULL + is_shortage = 1` as the new canonical shortage representation.

5. Index coverage is incomplete for the proposed trace/read/rebuild workloads.

   The blueprint requires indexes for PT/area, branch/document, item/source BC date/id, demand row ref, debit source ref, allocation ref, shortage flag, and source table/id/doc no (`MigrationBlueprint.md:479-488`). Current Subcon indexes cover pool, order, ref, and one main-table source unique index (`2026070801__OrderSubconTables.sql:228-232`, `:269-271`, `:296-297`), but not build batch, area, shortage review, source doc lookup across KOP/WIP/item-on-subcon, or allocation sequence/read model queries.

   Required: add explicit indexes after finalizing batch/area/source columns.

## LOW

1. Existing reviewed C# files are oversized under the loaded `programming` and `remove-ai-slops` maintainability perspectives.

   `RepoTRSubconAJU.cs`, `ServiceTRSubconAJU.cs`, `RepoHistoryStock.cs`, and `RequestModel.cs` are large multi-responsibility files. No code change is requested in this read-only schema audit, but adding StockBC Sales/Subcon logic directly into these files without modularization would violate the consulted skill perspectives and raise regression risk.

## Status

- codeQualityStatus: BLOCK
- recommendation: REQUEST_CHANGES
- blockers:
  - Add missing Sales/SJ schema and explicit debit-source link design before claiming WEB ERP StockBC migration coverage.
  - Add shared build batch/lock/audit schema and `build_batch_id` refs before hardening Subcon rebuild behavior.
  - Add or prove the replacement for area/warehouse partitioning before allowing Subcon pool allocation.
  - Add price/provenance trace fields or trace tables for Subcon item-on-subcon, KOP, WIP, normal allocation, and shortage paths.
