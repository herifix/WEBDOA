# Code Quality Review - whatsapp-new6-combined-template

Date: 2026-08-28
Reviewer role: read-only code quality reviewer
Recommendation: APPROVE
codeQualityStatus: WATCH

## Scope Reviewed

- `API/Service/Transaction/ServiceTRBirthdayPray.cs`
- `API.Tests/ServiceTRBirthdayPrayWhatsAppPayloadTests.cs`
- `docs/module-agents/TRBirthdayPray/AGENTS.md`
- `.omo/evidence/whatsapp-new6-combined-template/`
- `.omo/plans/whatsapp-new6-combined-template.md`
- `.omo/drafts/whatsapp-new6-combined-template.md`

## Skill Perspective Check

- `remove-ai-slops` was loaded from `C:/Users/Heri/.codex/plugins/cache/sisyphuslabs/omo/4.15.1/skills/remove-ai-slops/SKILL.md`.
- `programming` was loaded from `C:/Users/Heri/.codex/plugins/cache/sisyphuslabs/omo/4.15.1/skills/programming/SKILL.md`; `references/code-smells.md` was also consulted. Language-specific programming references were not applicable because the changed source/test files are C#.
- Result: no production-code slop found that blocks approval. Test slop/maintainability concerns remain, described under MEDIUM.

## Findings

### CRITICAL

None.

### HIGH

None.

### MEDIUM

1. `API.Tests/ServiceTRBirthdayPrayWhatsAppPayloadTests.cs` is oversized and carries a large bespoke ADO fake. The new test file measures 587 pure LOC, with `FakeBirthdayPrayConnection` and related fake `IDb*` scaffolding starting at `API.Tests/ServiceTRBirthdayPrayWhatsAppPayloadTests.cs:421` through `API.Tests/ServiceTRBirthdayPrayWhatsAppPayloadTests.cs:671`. This violates the `programming`/`remove-ai-slops` size and complexity perspective for newly added test files. I do not consider it a blocker for this task because the fake is currently what lets tests exercise the public `DebugSendWhatsApp` service seam without a real database, and those public seam tests cover the requested behavior. Future edits should extract/reuse a shared test fixture or add a cleaner repository abstraction instead of growing this file.

2. Some tests mirror private implementation via reflection instead of only observable behavior. Examples: direct private payload-builder invocation at `API.Tests/ServiceTRBirthdayPrayWhatsAppPayloadTests.cs:27`, private mode-helper checks at `API.Tests/ServiceTRBirthdayPrayWhatsAppPayloadTests.cs:76`, follow-up helper checks at `API.Tests/ServiceTRBirthdayPrayWhatsAppPayloadTests.cs:88`, combined payload-builder invocation at `API.Tests/ServiceTRBirthdayPrayWhatsAppPayloadTests.cs:99`, and the generic `InvokePrivate` helper at `API.Tests/ServiceTRBirthdayPrayWhatsAppPayloadTests.cs:414`. This is overfit/implementation-coupled coverage under the `remove-ai-slops` perspective. It is nonblocking because the same file also includes public `DebugSendWhatsApp` dry-run tests for `new6`, `new5`, other template names, blank main template rejection, and normalization at `API.Tests/ServiceTRBirthdayPrayWhatsAppPayloadTests.cs:136`, `API.Tests/ServiceTRBirthdayPrayWhatsAppPayloadTests.cs:171`, `API.Tests/ServiceTRBirthdayPrayWhatsAppPayloadTests.cs:202`, `API.Tests/ServiceTRBirthdayPrayWhatsAppPayloadTests.cs:232`, `API.Tests/ServiceTRBirthdayPrayWhatsAppPayloadTests.cs:260`, and `API.Tests/ServiceTRBirthdayPrayWhatsAppPayloadTests.cs:277`.

### LOW

1. Live public MP4 download remains environmentally blocked by external TLS certificate validity, not by this code change. Evidence records `HttpRequestException`, TLS classification, `contentVerifiedMp4=False`, and `verdict=EXTERNAL_TLS_BLOCKED` at `.omo/evidence/whatsapp-new6-combined-template/task-2-public-media.txt:15` through `.omo/evidence/whatsapp-new6-combined-template/task-2-public-media.txt:20`. The dry-run payload path is verified, but a real public-download check should be rerun after the certificate is renewed.

2. The plan artifact still shows final review checkboxes unchecked at `.omo/plans/whatsapp-new6-combined-template.md:84` through `.omo/plans/whatsapp-new6-combined-template.md:89`, while later evidence files and this report perform the review. This is process noise rather than a code blocker, but it may confuse future agents reading state.

## Correctness Evidence

- Main template name remains setting-derived: `ServiceTRBirthdayPray` trims `setting.whatsappTemplateName` into `mainTemplateName` at `API/Service/Transaction/ServiceTRBirthdayPray.cs:1331`.
- Mode selection is based on the trimmed setting value and case-insensitive `new6` comparison at `API/Service/Transaction/ServiceTRBirthdayPray.cs:1333` and `API/Service/Transaction/ServiceTRBirthdayPray.cs:3367`.
- Voice-template validation is conditional on legacy follow-up mode at `API/Service/Transaction/ServiceTRBirthdayPray.cs:1377`.
- The MP4 delivery URL is still produced through `EnsureWhatsAppMp4VoiceAsync` at `API/Service/Transaction/ServiceTRBirthdayPray.cs:1404`.
- `new6` builds the main payload with `BuildCombinedMainTemplatePayload` and `effectiveTemplateLink` at `API/Service/Transaction/ServiceTRBirthdayPray.cs:1497` through `API/Service/Transaction/ServiceTRBirthdayPray.cs:1508`.
- `new6` marks the follow-up stage successful/skipped with `audio_embedded_in_main_template` and returns before the legacy delay/send block at `API/Service/Transaction/ServiceTRBirthdayPray.cs:1547` through `API/Service/Transaction/ServiceTRBirthdayPray.cs:1564`.
- The legacy delay and voice follow-up remain only after the `new6` return, at `API/Service/Transaction/ServiceTRBirthdayPray.cs:1615` through `API/Service/Transaction/ServiceTRBirthdayPray.cs:1635`.
- The combined payload has a `video` header and the five requested body parameters in order at `API/Service/Transaction/ServiceTRBirthdayPray.cs:3265` through `API/Service/Transaction/ServiceTRBirthdayPray.cs:3304`.
- Scheduler path still delegates to the shared service through `SendScheduledWhatsApp`; no scheduler-specific payload change was introduced.
- Module knowledge base records setting-derived `new5`/`new6` behavior and the TLS caveat at `docs/module-agents/TRBirthdayPray/AGENTS.md:248`, `docs/module-agents/TRBirthdayPray/AGENTS.md:251`, `docs/module-agents/TRBirthdayPray/AGENTS.md:259`, `docs/module-agents/TRBirthdayPray/AGENTS.md:349`, and `docs/module-agents/TRBirthdayPray/AGENTS.md:652`.

## Verification Run By Reviewer

- `dotnet test API.Tests/API.Tests.csproj --logger "console;verbosity=minimal"`: PASS, 11 passed, 0 failed.
- `dotnet test API.Tests/API.Tests.csproj --filter FullyQualifiedName~ServiceTRBirthdayPrayWhatsAppPayloadTests --logger "console;verbosity=minimal"`: PASS, 10 passed, 0 failed.
- `dotnet build API/API.csproj --no-restore --nologo`: PASS, 0 warnings, 0 errors.
- `git diff --check -- API/Service/Transaction/ServiceTRBirthdayPray.cs API.Tests/ServiceTRBirthdayPrayWhatsAppPayloadTests.cs docs/module-agents/TRBirthdayPray/AGENTS.md`: PASS, exit code 0; only CRLF working-copy warnings for tracked files.
- Read-only parse/assertion of `.omo/evidence/whatsapp-new6-combined-template/task-2-dry-run.json`: PASS for `new6` video/single-stage, `new5` image/follow-up, body order, no gateway calls, no conversion trigger, and dry-run mutation count 0.

## Blockers

None.

## Final Decision

PASS with WATCH. The production implementation satisfies the requested behavior and the automated/build gates pass. The remaining risks are test maintainability and the external TLS-blocked public-media check; neither should block approval of this code change, but the test scaffold should not be allowed to keep growing in future work.
