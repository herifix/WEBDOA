# whatsapp-new6-combined-template - Work Plan

## TL;DR (For humans)
<!-- Fill this LAST, after the detailed plan below is written, so it summarizes the REAL plan. -->
<!-- Plain English for a non-engineer: NO file paths, NO todo numbers, NO wave/agent/tool names. -->

**What you'll get:** Template ulang tahun `new6` mengirim teks dan audio MP4 dalam satu pesan WhatsApp, sementara `new5` tetap mengirim greeting dan voice sebagai dua pesan.

**Why this approach:** Pemilihan perilaku dibatasi pada nama main template dan memakai hasil konversi MP4 yang sudah stabil, sehingga penyimpanan voice, scheduler, dan status kirim tidak berubah.

**What it will NOT do:** Tidak mengubah endpoint, database, frontend, penyimpanan voice, algoritme konversi, atau waktu penandaan status WhatsApp.

**Effort:** Short
**Risk:** Medium - perubahan berada di jalur gateway WhatsApp yang stabil dan harus mempertahankan kompatibilitas `new5`.
**Decisions to sanity-check:** `new6` tidak membutuhkan atau mengirim template voice kedua; template selain `new6` tetap memakai perilaku lama.

Your next move: Rencana telah disetujui dan sedang dieksekusi. Full execution detail follows below.

---

> TL;DR (machine): Short, medium-risk backend-only change adding combined-video mode for `ucapan_ulang_tahun_new6` with regression coverage for the existing flow.

## Scope
### Must have
- Detect `ucapan_ulang_tahun_new6` after trim/case-insensitive template-name normalization.
- Build the `new6` main template with a `video` header using the existing public MP4 delivery URL and the unchanged five body parameters.
- Skip voice-template validation, delay, and second gateway stage for `new6`, recording the follow-up debug stage as embedded/skipped.
- Preserve `new5` and all other template names as image-header main template plus optional voice follow-up.
- Add automated payload/mode tests, run the API test suite/build, and capture dry-run evidence.
- Update the scoped TRBirthdayPray knowledge base after behavior is verified.
### Must NOT have (guardrails, anti-slop, scope boundaries)
- Do not rewrite `ServiceVoiceStorage`, MP3-to-MP4 conversion, media storage, scheduler dispatch, or `IsWASent` marking order.
- Do not change endpoints, request models, database/schema, Application Setting fields, frontend code, gateway envelope order, or five body-parameter order.
- Do not send localhost/private URLs or expose tokens/PII in evidence.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: tests-after for the requested behavior, with a baseline characterization test and failing-first new6 test before production edits; xUnit on .NET 8.
- Evidence: `.omo/evidence/whatsapp-new6-combined-template/`

## Execution strategy
### Parallel execution waves
> Target 5-8 todos per wave. Fewer than 3 (except the final) means you under-split.
- Wave 1: payload mode implementation plus automated tests.
- Wave 2: agent-driven dry-run/manual QA against the real debug surface.
- Wave 3: knowledge-base update using verified evidence.
- Final: independent compliance, quality, QA, security/context, and scope review.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | none | 2, 3, F1-F4 | none (same-file implementation and tests) |
| 2 | 1 | 3, F1-F4 | none |
| 3 | 1, 2 | F1-F4 | none |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [x] 1. Implement template-mode routing and regression tests
  What to do / Must NOT do: Add a narrow template-mode resolver and build the main header as image or video. For `new6`, skip voice-template validation and the follow-up stage after successful main send. Preserve existing conversion, `IsWASent`, new5/other-name behavior, payload envelope, language, and five body values. Write a passing baseline characterization test first, then a failing new6 test, then the minimal production change.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 2, 3, F1-F4
  References (executor has NO interview context - be exhaustive): `API/Service/Transaction/ServiceTRBirthdayPray.cs:24`, `API/Service/Transaction/ServiceTRBirthdayPray.cs:1276`, `API/Service/Transaction/ServiceTRBirthdayPray.cs:1330`, `API/Service/Transaction/ServiceTRBirthdayPray.cs:1372`, `API/Service/Transaction/ServiceTRBirthdayPray.cs:1399`, `API/Service/Transaction/ServiceTRBirthdayPray.cs:1478`, `API/Service/Transaction/ServiceTRBirthdayPray.cs:1512`, `API/Service/Transaction/ServiceTRBirthdayPray.cs:1561`, `API/Service/Transaction/ServiceTRBirthdayPray.cs:3087`, `API/Service/Transaction/ServiceTRBirthdayPray.cs:3178`, `API/Service/Transaction/ServiceTRBirthdayPray.cs:3211`, `API.Tests/API.Tests.csproj`, `API.Tests/ServiceVoiceStorageTests.cs`.
  Acceptance criteria (agent-executable): `dotnet test API.Tests/API.Tests.csproj --no-restore` exits 0; tests assert new5/other names use image+follow-up mode, new6 uses video+single-message mode, normalization works, header link is the MP4 URL, and all five body values retain order.
  QA scenarios (name the exact tool + invocation): invoke the pure private mode/payload seams through the existing reflection-style xUnit pattern; record the pre-change failing new6 assertion and post-change full pass in `.omo/evidence/whatsapp-new6-combined-template/task-1-tests.txt`.
  Commit: N | user did not request a commit.

- [ ] 2. Verify build and dry-run debug behavior
  Status: BLOCKED externally on 2026-08-28. Service/payload manual QA is confirmed, but the configured public host certificate is expired (`NotTimeValid` / `SEC_E_CERT_EXPIRED`), so the real MP4 URL cannot complete a TLS download until infrastructure renews the certificate.
  What to do / Must NOT do: Run the API build/test suite and drive `DebugSendWhatsApp` in `runLive:false` mode for configured new5 and new6 scenarios without contacting the gateway or mutating `IsWASent`. If local database/config prevents an endpoint dry-run, use an isolated agent-owned harness that executes the same service seam and records the limitation; do not change production config or user data merely for QA.
  Parallelization: Wave 2 | Blocked by: 1 | Blocks: 3, F1-F4
  References (executor has NO interview context - be exhaustive): `API/Controllers/Transaction/ControllerTRBirthdayPray.cs:83`, `API/Repository/global/RequestModel.cs:211`, `API/Service/Transaction/ServiceTRBirthdayPray.cs:1226`, `API/Service/Transaction/ServiceTRBirthdayPray.cs:1929`, `API/appsettings.Development.json`.
  Acceptance criteria (agent-executable): build and tests exit 0; new5 debug evidence contains main image payload and attempted follow-up stage; new6 contains main video payload and follow-up stage `Skipped=true` with an embedded-audio reason; no live gateway request occurs and persisted status remains unchanged.
  QA scenarios (name the exact tool + invocation): POST `api/Transaction/TRBirthdayPray/DebugSendWhatsApp` with JSON `{\"idDonatur\":<test-id>,\"year\":<year>,\"runLive\":false,\"includeFollowUpVoice\":true}` against a locally started API when safe; capture redacted request/response and before/after status in `.omo/evidence/whatsapp-new6-combined-template/task-2-dry-run.json` plus command log.
  Commit: N | user did not request a commit.

- [x] 3. Record verified module behavior
  What to do / Must NOT do: Update only the scoped TRBirthdayPray knowledge base with the confirmed new5/new6 routing, source-of-truth paths, risks, and verification level/date. Do not duplicate root guardrails or claim runtime verification that was not achieved.
  Parallelization: Wave 3 | Blocked by: 1, 2 | Blocks: F1-F4
  References (executor has NO interview context - be exhaustive): `docs/module-agents/TRBirthdayPray/AGENTS.md:239`, `docs/module-agents/TRBirthdayPray/AGENTS.md:301`, `docs/module-agents/TRBirthdayPray/AGENTS.md:336`, `docs/module-agents/TRBirthdayPray/AGENTS.md:548`, `.omo/evidence/whatsapp-new6-combined-template/`.
  Acceptance criteria (agent-executable): documentation distinguishes new5 two-stage and new6 one-stage behavior, preserves public-media and status guardrails, cites actual verification, and contains no credentials or donor PII.
  QA scenarios (name the exact tool + invocation): `rg -n \"ucapan_ulang_tahun_new5|ucapan_ulang_tahun_new6|embedded|single\" docs/module-agents/TRBirthdayPray/AGENTS.md` plus diff review; evidence `.omo/evidence/whatsapp-new6-combined-template/task-3-docs.txt`.
  Commit: N | user did not request a commit.

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit
  Status: Implementation requirements PASS, but overall completion remains blocked by F3 public-media reachability.
- [x] F2. Code quality review
- [ ] F3. Real manual QA
  Status: Deferred to the user; automated/public-service behavior PASS, but the configured public host certificate is expired and prevents a valid MP4 download.
- [x] F4. Scope fidelity

## Commit strategy
- Do not create a commit unless explicitly requested. Keep the diff limited to the service, focused tests, scoped module knowledge base, and `.omo` evidence/state.

## Success criteria
- `ucapan_ulang_tahun_new6` sends one main-template payload with a video header pointing to the existing MP4 delivery URL and unchanged five body values.
- `ucapan_ulang_tahun_new6` neither requires nor sends `MsgWA_VoiceTemplateName`; debug output explicitly reports the embedded follow-up skip.
- `ucapan_ulang_tahun_new5` and all other template names retain current image-main plus voice-follow-up behavior.
- No changes land in voice storage/conversion, scheduler, database, controller/request contracts, frontend, or `IsWASent` ordering.
- Automated tests/build pass, manual QA is artifact-backed or its environmental limitation is explicitly evidenced, documentation is accurate, and all final review lanes approve.
