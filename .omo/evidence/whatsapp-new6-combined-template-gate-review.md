recommendation: REJECT

blockers:
- The required current-goal code review report now exists at `.omo/evidence/whatsapp-new6-combined-template-code-review.md` and explicitly mentions `remove-ai-slops`, `programming`, and overfit/implementation-coupled tests. However, it also acknowledges unresolved oversized-test and private-reflection slop, then marks it nonblocking. The final gate instruction requires REJECT when my direct pass finds unresolved slop.
- Work state remains incomplete/blocked. `.omo/plans/whatsapp-new6-combined-template.md` still has task 2 unchecked and marked externally blocked, and final lanes F1-F4 are unchecked. `.omo/boulder.json` still marks `whatsapp-new6-combined-template` as `active`. `.omo/start-work/ledger.jsonl` records task 2 as `task-blocked` because public media verification failed on TLS.
- Public MP4 media was not verified as publicly downloadable media. `.omo/evidence/whatsapp-new6-combined-template/task-2-public-media.txt` records `contentNonZero=False`, `contentVerifiedMp4=False`, and `verdict=EXTERNAL_TLS_BLOCKED` because `yobel.intsoftware.co.id` fails certificate validity (`NotTimeValid` / `SEC_E_CERT_EXPIRED`). This is not a newly introduced code vulnerability, but it prevents the gate from counting the public MP4 URL criterion as satisfied.
- Direct `remove-ai-slops`/`programming` pass found unresolved maintenance/test slop. `API.Tests/ServiceTRBirthdayPrayWhatsAppPayloadTests.cs` measures 587 pure LOC and includes private reflection tests that mirror implementation details rather than only observable behavior: `BuildNewTemplatePayload` at lines 27-68, `ShouldUseCombinedVoiceMainTemplate` at lines 76-80, `ShouldSendFollowUpVoice` at lines 88-91, `BuildCombinedMainTemplatePayload` at lines 99-132, and `InvokePrivate` at lines 414-418. The public `DebugSendWhatsApp` tests are useful and pass, but these private-method tests create false confidence and would fail on behavior-preserving private refactors.
- Direct production slop pass found a needless single-use helper: `ShouldSendFollowUpVoice` at `API/Service/Transaction/ServiceTRBirthdayPray.cs:3374-3377` wraps one boolean expression and is only called once at `API/Service/Transaction/ServiceTRBirthdayPray.cs:1334-1336`. It appears to exist mainly to support private reflection testing, adding maintenance surface without a real seam.

originalIntent:
- Main WhatsApp template name must still come from Application Setting (`MsgWA_TemplateName`), including for `ucapan_ulang_tahun_new5` and `ucapan_ulang_tahun_new6`.
- `ucapan_ulang_tahun_new5` keeps the current behavior: main template with IMAGE header, then configured voice template as the second message.
- `ucapan_ulang_tahun_new6` sends one combined message: main template with VIDEO MP4 header from the voice media, same five body parameters in the same order, no required voice-template setting, no delay, and no second gateway request.
- Template names other than `new6` preserve existing compatibility behavior.
- Do not change endpoint/model/database/Application Setting contracts, frontend, scheduler, voice storage, MP3-to-MP4 conversion, public media failure semantics, or `IsWASent` timing.
- Record verified behavior in `docs/module-agents/TRBirthdayPray/AGENTS.md`.

desiredOutcome:
- Operators choose either `ucapan_ulang_tahun_new5` or `ucapan_ulang_tahun_new6` through the existing main-template setting.
- `new6` delivers text and audio as one WhatsApp template payload while `new5` and other templates remain two-stage compatible.
- The shipped evidence proves payload shape, stage count, body order, dry-run non-mutation, API build/tests, public MP4 readiness or an explicitly accepted external limitation, and module KB accuracy.

userOutcomeReview:
- The production diff likely implements the core requested runtime behavior. `ServiceTRBirthdayPray` trims `setting.whatsappTemplateName` and keeps it as the outbound name at `API/Service/Transaction/ServiceTRBirthdayPray.cs:1331`; chooses combined mode with a trim/case-insensitive comparison at `API/Service/Transaction/ServiceTRBirthdayPray.cs:1333-1336` and `API/Service/Transaction/ServiceTRBirthdayPray.cs:3367-3371`; skips voice-template validation for combined mode at `API/Service/Transaction/ServiceTRBirthdayPray.cs:1377`; uses `EnsureWhatsAppMp4VoiceAsync` output as `effectiveTemplateLink` at `API/Service/Transaction/ServiceTRBirthdayPray.cs:1404-1405`; builds the new6 main payload with a video header at `API/Service/Transaction/ServiceTRBirthdayPray.cs:1497-1508` and `API/Service/Transaction/ServiceTRBirthdayPray.cs:3265-3310`; returns before the follow-up delay/request at `API/Service/Transaction/ServiceTRBirthdayPray.cs:1547-1564`; and leaves the legacy delay/follow-up path after that at `API/Service/Transaction/ServiceTRBirthdayPray.cs:1566-1635`.
- `IsWASent` timing appears unchanged: live persistence still occurs before gateway validation/media delivery at `API/Service/Transaction/ServiceTRBirthdayPray.cs:1277-1299`, while debug uses `PersistWASent=false` at `API/Service/Transaction/ServiceTRBirthdayPray.cs:1237-1241`.
- The scoped knowledge base was updated and now documents setting-sourced main template behavior, `new6` combined video behavior, `new5`/other compatibility, skip reason, and the TLS caveat in `docs/module-agents/TRBirthdayPray/AGENTS.md`.
- Fresh gate-run checks passed: `dotnet test API.Tests\API.Tests.csproj --no-restore --logger "console;verbosity=minimal"` passed 11/11; `dotnet build API\API.csproj --no-restore --nologo` passed with 0 warnings and 0 errors; `git diff --check` exited 0 with only CRLF warnings.
- Despite the promising product behavior, the shipped artifact cannot be approved because final gate criteria are not met: public MP4 download/content verification is blocked, OMO plan/state remains active/blocked, and direct slop review found unresolved test and production maintenance burden.

checkedArtifactPaths:
- `API/Service/Transaction/ServiceTRBirthdayPray.cs`
- `API.Tests/ServiceTRBirthdayPrayWhatsAppPayloadTests.cs`
- `docs/module-agents/TRBirthdayPray/AGENTS.md`
- `API/appsettings.Development.json`
- `API/appsettings.Production.json`
- `.omo/plans/whatsapp-new6-combined-template.md`
- `.omo/boulder.json`
- `.omo/start-work/ledger.jsonl`
- `.omo/evidence/whatsapp-new6-combined-template-code-review.md`
- `.omo/evidence/whatsapp-new6-combined-template/final-evidence.md`
- `.omo/evidence/whatsapp-new6-combined-template/final-dotnet-test.log`
- `.omo/evidence/whatsapp-new6-combined-template/final-dotnet-build-api.log`
- `.omo/evidence/whatsapp-new6-combined-template/final-focused-dotnet-test.log`
- `.omo/evidence/whatsapp-new6-combined-template/final-manual-probe.log`
- `.omo/evidence/whatsapp-new6-combined-template/task-1-tests.txt`
- `.omo/evidence/whatsapp-new6-combined-template/task-2-build-api-tests.txt`
- `.omo/evidence/whatsapp-new6-combined-template/task-2-curl-run.txt`
- `.omo/evidence/whatsapp-new6-combined-template/task-2-dry-run.json`
- `.omo/evidence/whatsapp-new6-combined-template/task-2-harness-run.txt`
- `.omo/evidence/whatsapp-new6-combined-template/task-2-public-media.txt`
- `.omo/evidence/whatsapp-new6-combined-template/task-2-qa.txt`
- `.omo/evidence/whatsapp-new6-combined-template/task-3-docs.txt`
- `.omo/evidence/whatsapp-new6-combined-template/task-2-manual-probe-src/Program.cs`
- `.omo/evidence/whatsapp-new6-combined-template/task-2-manual-probe-src/ManualProbe.csproj`
- `.omo/evidence/whatsapp-new6-combined-template/hook-stop-verify-3/verification-summary.md`
- `.omo/evidence/whatsapp-new6-combined-template/hook-stop-verify-3/focused-tests.log`
- `.omo/evidence/whatsapp-new6-combined-template/hook-stop-verify-3/full-api-tests.log`
- `.omo/evidence/whatsapp-new6-combined-template/hook-stop-verify-3/api-build.log`
- `.omo/evidence/whatsapp-new6-combined-template/hook-stop-verify-3/dry-run-observables.log`
- `.omo/evidence/whatsapp-new6-combined-template/hook-stop-verify-3/manual-probe.log`
- `.omo/evidence/whatsapp-new6-combined-template/hook-stop-verify-3/public-media.log`
- `.omo/evidence/whatsapp-new6-combined-template/manual-qa-20260828/dotnet-test-api-tests.log`
- `.omo/evidence/whatsapp-new6-combined-template/manual-qa-20260828/dotnet-build-api.log`
- `.omo/evidence/whatsapp-new6-combined-template/manual-qa-20260828/manual-probe-run.log`
- `.omo/evidence/whatsapp-new6-combined-template/manual-qa-20260828/manual-probe-source-inspection.log`
- `.omo/evidence/whatsapp-new6-combined-template/manual-qa-20260828/prior-dry-run-json-inspection.log`
- `.omo/evidence/stockbc-schema-design-audit-code-review.md` (checked only to confirm it is unrelated)

exactEvidenceGaps:
- No successful public MP4 HTTP/TLS/content verification. Existing evidence proves a derived URL/hash and accessible UNC-root candidate, but not public downloadability or MP4 content.
- No artifact shows the external TLS certificate issue was resolved.
- No approved final-review lane checkboxes for F1-F4 in `.omo/plans/whatsapp-new6-combined-template.md`; task 2 still records a blocked state.
- No artifact shows the private-reflection/oversized-test slop was fixed or explicitly accepted by the final gate owner with a specific rationale.
- No artifact shows the single-use `ShouldSendFollowUpVoice` helper was fixed or accepted as a necessary production abstraction.

directSlopAndProgrammingReview:
- `remove-ai-slops` was loaded from `C:/Users/Heri/.codex/plugins/cache/sisyphuslabs/omo/4.15.1/skills/remove-ai-slops/SKILL.md`.
- `programming` was loaded from `C:/Users/Heri/.codex/plugins/cache/sisyphuslabs/omo/4.15.1/skills/programming/SKILL.md`; `references/code-smells.md` was also loaded because the review turns on file-size and maintenance-smell criteria. No language-specific reference applies to C#, so I applied the shared criteria: test observable behavior, avoid needless abstraction, avoid false confidence, avoid oversized maintenance burden, and keep changes scoped.
- Direct pass result: production behavior is narrowly scoped and mostly aligned, but unresolved slop remains in private reflection tests, an oversized new test file, and one needless production helper. The code review report identified the test slop but did not treat it as blocking; the final gate instruction makes unresolved slop blocking.

securityReview:
- No new endpoint, auth contract, database schema, dependency, token handling, file/path write, TLS bypass, or live gateway call was introduced by the product diff.
- Evidence search did not find gateway tokens or real media object paths in the current new6 evidence. Test/dry-run data uses synthetic donor/pendoa names and hashed media URLs.
- The expired `yobel.intsoftware.co.id` certificate is an operational security/public-delivery blocker, not a newly introduced code vulnerability. The correct remediation is certificate renewal/public-host fix, not disabling TLS validation.

qualityGatesRunByGate:
- `dotnet test API.Tests\API.Tests.csproj --no-restore --logger "console;verbosity=minimal"`: PASS, 11 passed, 0 failed.
- `dotnet build API\API.csproj --no-restore --nologo`: PASS, 0 warnings, 0 errors.
- `git diff --check`: PASS, exit 0; output only CRLF working-copy warnings for tracked files.
- Pure LOC measured by gate: `API/Service/Transaction/ServiceTRBirthdayPray.cs` 3923, `API.Tests/ServiceTRBirthdayPrayWhatsAppPayloadTests.cs` 587, `docs/module-agents/TRBirthdayPray/AGENTS.md` 532.

finalDecision:
- REJECT until the blocked public-media/manual-QA state is resolved or explicitly re-scoped by the final gate owner, `.omo` plan/state is closed, and the private-reflection/oversized-test plus single-use-helper slop is fixed or specifically justified under the final gate criteria.
