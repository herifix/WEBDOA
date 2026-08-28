# WhatsApp new6 combined template final evidence

Date: 2026-08-28
Workspace: D:\KANTOR\Project VB\WEB DOA

## Changed files

- API/Service/Transaction/ServiceTRBirthdayPray.cs
  - Selects send mode from trimmed MsgWA_TemplateName.
  - Uses case-insensitive comparison only for ucapan_ulang_tahun_new6 mode selection.
  - Keeps the outbound main template name as the configured setting value after trim.
  - new6 builds a VIDEO header from the existing MP4 delivery URL and returns after the main stage.
  - non-new6 keeps IMAGE main template plus configured voice follow-up.
- API.Tests/ServiceTRBirthdayPrayWhatsAppPayloadTests.cs
  - Adds focused payload and DebugSendWhatsApp dry-run coverage.
- docs/module-agents/TRBirthdayPray/AGENTS.md
  - Records the setting-sourced new5/new6 behavior and the TLS verification caveat.
  - Tightens older notes so they no longer contradict the new6 exception.
- Evidence artifacts under .omo/evidence/whatsapp-new6-combined-template/

Existing shared .omo state files were preserved; no database, frontend, endpoint, request model, application setting, storage flow, scheduler flow, or gateway setting was intentionally changed.

## Verification matrix

### S1-new6 combined one-message flow

- Scenario: MsgWA_TemplateName = ucapan_ulang_tahun_new6 and MsgWA_VoiceTemplateName blank.
- Invocation: dotnet test API.Tests\API.Tests.csproj --filter FullyQualifiedName~ServiceTRBirthdayPrayWhatsAppPayloadTests --logger "trx;LogFileName=whatsapp-new6-focused-tests.trx"
- Binary observable: DebugSendWhatsApp_New6UsesOneDryRunVideoStageAndSkipsBlankVoiceTemplate passed; focused test run Passed: 10, Failed: 0.
- Artifact: .omo/evidence/whatsapp-new6-combined-template/final-focused-dotnet-test.log
- Artifact: API.Tests/TestResults/whatsapp-new6-focused-tests.trx

### S2-new6 dry-run payload and side effects

- Scenario: public ServiceTRBirthdayPray.DebugSendWhatsApp(runLive:false, includeFollowUpVoice:true) through manual harness.
- Invocation: dotnet run --project .omo/evidence/whatsapp-new6-combined-template/task-2-manual-probe-src/ManualProbe.csproj -- .omo/evidence/whatsapp-new6-combined-template
- Binary observable: S1-new6-blank-voice success=true, mode=dry_run, persistSkipped=true, mainHeaderType=video, bodyTexts=["Donatur Test","Pendoa Test",".","Isi doa test","+628987654321"], followAttempted=false, followSkippedReason=audio_embedded_in_main_template, mutationCount=0.
- Artifact: .omo/evidence/whatsapp-new6-combined-template/final-manual-probe.log
- Artifact: .omo/evidence/whatsapp-new6-combined-template/task-2-dry-run.json

### S3-new5 preserved two-stage behavior

- Scenario: MsgWA_TemplateName = ucapan_ulang_tahun_new5 with configured voice_template_configured follow-up.
- Invocation: dotnet test API.Tests\API.Tests.csproj --filter FullyQualifiedName~ServiceTRBirthdayPrayWhatsAppPayloadTests --logger "trx;LogFileName=whatsapp-new6-focused-tests.trx"
- Binary observable: DebugSendWhatsApp_New5UsesImageMainAndConfiguredVoiceFollowUpDryRunStages passed.
- Artifact: .omo/evidence/whatsapp-new6-combined-template/final-focused-dotnet-test.log
- Artifact: API.Tests/TestResults/whatsapp-new6-focused-tests.trx

### S4-new5 manual harness payload and side effects

- Scenario: public ServiceTRBirthdayPray.DebugSendWhatsApp dry-run through manual harness.
- Invocation: dotnet run --project .omo/evidence/whatsapp-new6-combined-template/task-2-manual-probe-src/ManualProbe.csproj -- .omo/evidence/whatsapp-new6-combined-template
- Binary observable: S2-new5-follow-up success=true, mainHeaderType=image, followAttempted=true, followTemplateName=voice_template_configured, followHeaderType=video, mutationCount=0.
- Artifact: .omo/evidence/whatsapp-new6-combined-template/final-manual-probe.log
- Artifact: .omo/evidence/whatsapp-new6-combined-template/task-2-dry-run.json

### S5-non-new6 compatibility

- Scenario: MsgWA_TemplateName = template_lain.
- Invocation: dotnet test API.Tests\API.Tests.csproj --filter FullyQualifiedName~ServiceTRBirthdayPrayWhatsAppPayloadTests --logger "trx;LogFileName=whatsapp-new6-focused-tests.trx"
- Binary observable: DebugSendWhatsApp_UnrelatedTemplateWithFollowUpEnabledKeepsLegacyTwoStageBehavior passed; DebugSendWhatsApp_UnrelatedTemplateWithFollowUpDisabledKeepsImageMainAndDisabledSkip passed.
- Artifact: .omo/evidence/whatsapp-new6-combined-template/final-focused-dotnet-test.log
- Artifact: API.Tests/TestResults/whatsapp-new6-focused-tests.trx

### S6-template normalization and setting source

- Scenario: MsgWA_TemplateName = "  UCAPAN_ULANG_TAHUN_NEW6  ".
- Invocation: dotnet test API.Tests\API.Tests.csproj --filter FullyQualifiedName~ServiceTRBirthdayPrayWhatsAppPayloadTests --logger "trx;LogFileName=whatsapp-new6-focused-tests.trx"
- Binary observable: CombinedTemplateMode_OnlyMatchesTrimmedCaseInsensitiveNew6 passed; DebugSendWhatsApp_New6NormalizationKeepsTrimmedConfiguredOutboundTemplateName passed.
- Artifact: .omo/evidence/whatsapp-new6-combined-template/final-focused-dotnet-test.log
- Artifact: API.Tests/TestResults/whatsapp-new6-focused-tests.trx
- Invocation: dotnet run --project .omo/evidence/whatsapp-new6-combined-template/task-2-manual-probe-src/ManualProbe.csproj -- .omo/evidence/whatsapp-new6-combined-template
- Binary observable: S3-new6-trim-case mainTemplateName=UCAPAN_ULANG_TAHUN_NEW6, mainHeaderType=video, followAttempted=false, mutationCount=0.
- Artifact: .omo/evidence/whatsapp-new6-combined-template/task-2-dry-run.json

### S7-full API tests

- Scenario: entire API.Tests suite.
- Invocation: dotnet test API.Tests\API.Tests.csproj --logger "trx;LogFileName=whatsapp-new6-api-tests.trx"
- Binary observable: Passed: 11, Failed: 0, Skipped: 0, Total: 11.
- Artifact: .omo/evidence/whatsapp-new6-combined-template/final-dotnet-test.log
- Artifact: API.Tests/TestResults/whatsapp-new6-api-tests.trx

### S8-API build

- Scenario: API project build after tests.
- Invocation: dotnet build API\API.csproj --no-restore
- Binary observable: Build succeeded; 0 Warning(s); 0 Error(s).
- Artifact: .omo/evidence/whatsapp-new6-combined-template/final-dotnet-build-api.log

### S9-public MP4 media guardrail

- Scenario: configured Development public base and UNC/prod voice root checked read-only; existing MP4 candidate mapped to a public URL hash.
- Invocation: dotnet run --project .omo/evidence/whatsapp-new6-combined-template/task-2-manual-probe-src/ManualProbe.csproj -- .omo/evidence/whatsapp-new6-combined-template
- Binary observable: candidateRootAccessible=True, candidateUnderConfiguredRoot=True, publicUrlSha256=3238d9eff604f8cccef53018066be689d86120a4ae36d8168765bb43b7fc56e6, verdict=EXTERNAL_TLS_BLOCKED.
- Artifact: .omo/evidence/whatsapp-new6-combined-template/task-2-public-media.txt
- Risk: live public MP4 fetch was not proven because yobel.intsoftware.co.id currently fails TLS validity checks (NotTimeValid / SEC_E_CERT_EXPIRED). No live gateway success is claimed.

### S10-doc and diff hygiene

- Scenario: module knowledge base documents the verified behavior and caveat.
- Invocation: rg -n 'ucapan_ulang_tahun_new5|ucapan_ulang_tahun_new6|MsgWA_TemplateName|NotTimeValid|SEC_E_CERT_EXPIRED|combined-template exception|audio_embedded_in_main_template' docs/module-agents/TRBirthdayPray/AGENTS.md
- Binary observable: matches include MsgWA_TemplateName setting source, new6 VIDEO one-message behavior, new5 IMAGE plus follow-up behavior, combined-template exception, audio_embedded_in_main_template, and TLS caveat.
- Artifact: this file, plus terminal output captured in session transcript.
- Invocation: git diff --check -- API/Service/Transaction/ServiceTRBirthdayPray.cs API.Tests/ServiceTRBirthdayPrayWhatsAppPayloadTests.cs docs/module-agents/TRBirthdayPray/AGENTS.md .omo/evidence/whatsapp-new6-combined-template/final-dotnet-test.log .omo/evidence/whatsapp-new6-combined-template/final-dotnet-build-api.log .omo/evidence/whatsapp-new6-combined-template/final-focused-dotnet-test.log .omo/evidence/whatsapp-new6-combined-template/final-manual-probe.log .omo/evidence/whatsapp-new6-combined-template/task-2-dry-run.json .omo/evidence/whatsapp-new6-combined-template/task-2-public-media.txt
- Binary observable: exit code 0; only CRLF working-copy warnings for tracked files.
- Artifact: this file, plus terminal output captured in session transcript.

## Post-implementation review

- Goal and constraint review: PASS. new6 is one VIDEO main-template dry-run stage with five body parameters and no voice-template requirement; new5 and non-new6 remain compatible.
- Code quality review: PASS. Change is scoped to the existing shared service path and small private helpers; no endpoint, DB, frontend, scheduler, or storage rewrite.
- Security review: PASS. No new secrets, auth behavior, external inputs, dependencies, file writes, or live gateway calls were added.
- QA review: PASS for application flow, with EXTERNAL_TLS_BLOCKED for live public MP4 download due to certificate validity.
- Context review: PASS. Recent git history and module KB confirm this area is setting-driven and stable unless explicitly changed by the user.

The omo:review-work skill was read and used as a review checklist. Its requested child-agent orchestration could not be executed because the collaboration spawn/wait tools are not exposed in this session, so the five review lanes above were performed directly.
