# TRBirthdayPray AGENTS

This file is the canonical knowledge base for the `TRBirthdayPray` module
cluster in `WEB DOA`. Use it as the first stop for tracing, modifying, and
reviewing dashboard, transaction, voice handoff, WhatsApp send/status/debug,
and autosend behavior.

> **Living knowledge base:** Read this file before changing the module. In the
> same task, record code-verified changes and proven bug findings here so the
> next investigation starts from evidence rather than rediscovering behavior.

## 0. Knowledge Base Charter

This is the operational memory for the birthday-pray and WhatsApp send system.
Code and runtime evidence take precedence over chat recollection, assumptions,
or provider folklore.

Before changing or diagnosing a send flow, answer these questions:

1. Which path is affected: manual send, test text, test voice, service-driven
   auto-send, or `WhatsAppSchedulerWorker`?
2. Is the symptom application logic, configuration/storage, data, or a
   downstream gateway/Meta/provider condition?
3. What source-of-truth path, persisted state, and side effects are involved?
4. What regression guard prevents this exact problem from returning?

### Learning boundaries

- Learn only from source inspection, reproducible runtime evidence, approved
  behavior changes, or documented provider responses. Label unproven ideas as
  hypotheses; never promote them to rules.
- A learned note must state the trace, confirmed condition or root cause, safe
  prevention rule, verification level, and date.
- Never store donor PII, gateway tokens, cookies, credentials, request headers,
  or full provider payloads. Mask values when an identifier is needed.
- A knowledge-base note guides future work but does not authorize a behavior
  change; root guardrails and explicit user scope still control code edits.
- Re-check drift-prone provider behavior, including response shapes,
  registration state, and media-fetch requirements, before relying on an older
  note.

## 1. Scope And Current Source Of Truth

This module cluster includes:

- birthday dashboard listing and grouped month/date presentation
- birthday pray detail/edit flow per donatur
- voice upload handoff and stored-audio preview/delivery URL resolution
- manual WhatsApp send, test send, media debug, and delivery-status lookup
- auto-send scheduler setting and worker-based dispatch

Check these files first before making changes:

- `client/src/Pages/Dashboard.tsx`
- `client/src/Pages/Transaction/TRBirthdayPray.tsx`
- `client/src/Pages/Tools/WhatsAppSchedule.tsx`
- `client/src/Pages/Tools/ApplicationSetting.tsx`
- `client/src/hooks/react_query/useFetchTRBirthdayPray.ts`
- `client/src/service/trBirthdayPrayService.ts`
- `API/Controllers/Transaction/ControllerTRBirthdayPray.cs`
- `API/Controllers/Transaction/ControllerVoice.cs`
- `API/Service/Transaction/ServiceTRBirthdayPray.cs`
- `API/Service/Transaction/ServiceVoiceStorage.cs`
- `API/Service/Transaction/WhatsAppSchedulerWorker.cs`
- `API/Repository/Transaction/RepoTRBirthdayPray.cs`
- `API/Repository/Transaction/RepoVoiceRecording.cs`
- `API/Repository/Master/RepoApplicationSetting.cs`
- `API/Repository/Master/RepoWhatsAppSchedule.cs`
- `API/Program.cs`

## 2. Overview / Module Map

### UI surfaces

| Surface | Current route | Main file | Notes |
| --- | --- | --- | --- |
| Dashboard | `/dashboard` | `client/src/Pages/Dashboard.tsx` | Loads grouped birthday window from `GetDashboard`. |
| Birthday pray detail | `/transaksi-birthday-pray/:idDonatur` | `client/src/Pages/Transaction/TRBirthdayPray.tsx` | Main edit/save/send/debug screen. |
| WhatsApp scheduler tool | `/tools-whatsapp-schedule` | `client/src/Pages/Tools/WhatsAppSchedule.tsx` | Controls send time and active flag. |
| Application setting tool | `/tools-application-setting` | `client/src/Pages/Tools/ApplicationSetting.tsx` | Controls the WABA main/voice template names, storage type, link, image, gateway token, and WhatsApp sender phone-number ID fields. |

### Form IDs and permission anchors

| Surface | Form ID constant | Value | Notes |
| --- | --- | --- | --- |
| Birthday pray detail | `FORM_IDS.transaksiBirthdayPray` | `14` | Used by `useFormMenuPermissions`. |
| WhatsApp scheduler tool | `FORM_IDS.whatsappSchedule` | `13` | Used by scheduler setting page. |
| Application setting tool | `FORM_IDS.ApplicationSet` | `15` | Used by application setting page. |
| Dashboard | none found in current repo | n/a | Dashboard route is present, but no dashboard-specific form ID was found in current search. |

### API entry points

| Area | Route | Notes |
| --- | --- | --- |
| Dashboard window | `GET api/Transaction/TRBirthdayPray/GetDashboard?tgl=...` | Main dashboard data window. |
| Exact date | `GET api/Transaction/TRBirthdayPray/UpcomingBirthdayByTgl?tgl=...` | Exact-date birthday query contract. |
| Date statuses | `GET api/Transaction/TRBirthdayPray/GetDateStatuses` | Calendar/date-status API. |
| Detail | `GET api/Transaction/TRBirthdayPray/GetDataByDonatur?idDonatur=...&year=...` | Loads current or requested birthday-year row. |
| History | `GET api/Transaction/TRBirthdayPray/GetHistoryByDonatur?idDonatur=...` | Loads prior rows for the donatur. |
| Save main form | `PUT api/Transaction/TRBirthdayPray/Save` | Current UI save path. |
| Save voice only | `PUT api/Transaction/TRBirthdayPray/SaveVoice` | Supported backend path, not the current page's main save path. |
| Save voice with FFmpeg | `PUT api/Transaction/TRBirthdayPray/SaveVoiceFFmpeg` | Supported backend path for broader audio formats. |
| Manual WhatsApp send | `POST api/Transaction/TRBirthdayPray/SendWhatsApp` | Main manual send path. |
| Auto-send trigger endpoint | `GET api/Transaction/TRBirthdayPray/SendNextTodayWhatsApp` | Service-driven send-next-today path. |
| Test text send | `POST api/Transaction/TRBirthdayPray/SendTestWhatsAppText` | Gateway text probe. |
| Test voice send | `POST api/Transaction/TRBirthdayPray/SendTestWhatsAppVoice` | Gateway media probe. |
| Phone numbers | `GET api/Transaction/TRBirthdayPray/GetPhoneNumbers` | Gateway phone-number lookup utility. |
| Media debug | `GET api/Transaction/TRBirthdayPray/GetMediaDebugInfo?idDonatur=...&year=...` | Audio URL and storage diagnostics. |
| Delivery status | `GET api/Transaction/TRBirthdayPray/GetWhatsAppDeliveryStatus?idDonatur=...&year=...&debug=...` | Conversation-message status lookup. |
| Voice upload | `POST api/voice/upload-mp3` | Current UI handoff to `ServiceVoiceStorage`. |
| Voice signed URL | `GET api/voice/{id}/signed-url` | Signed/public playback lookup. |
| Voice redirect | `GET api/voice/{id}/redirect` | Redirects to the resolved playback URL. |

## 3. Dependency Map

### Frontend dependencies

- `Dashboard.tsx` depends on `useFetchBirthdayDashboard`,
  `useSendWhatsAppBirthdayPray`, and
  `useFetchTRBirthdayPrayWhatsAppDeliveryStatus`.
- `TRBirthdayPray.tsx` depends on detail/history hooks, application setting,
  voice upload, manual send, test send, media debug, delivery status, and
  `useFormMenuPermissions(FORM_IDS.transaksiBirthdayPray)`.
- `TRBirthdayPray.tsx` uses `buildMediaUrl` for preview URLs and
  `convertRecordedBlobToMp3File` for in-browser microphone conversion before
  upload.
- `WhatsAppSchedule.tsx` and `ApplicationSetting.tsx` are module-adjacent tools
  that directly affect TRBirthdayPray behavior even though they are not inside
  the transaction page.

### Backend services and repos

- `ServiceTRBirthdayPray` is the main orchestration layer for dashboard, detail,
  save, media debug, manual send, test send, and delivery-status lookup.
- `RepoTRBirthdayPray` owns the birthday SQL windowing, donor lookup,
  history lookup, create/update, and `IsWASent` marking.
- `RepoMasterDonatur` is the source of donatur identity, birthday, and phone
  data used during save and send flows.
- `RepoApplicationSetting` reads and upserts `MsProg`, which stores
  `MsgTemplate`, `MsgLink`, `MsgImage`, `MsgWA_TemplateName`,
  `MsgWA_VoiceTemplateName`, `MsgWA_Token`, `MsgWA_PhoneNumberId`, and
  `StorageType`.
- `ServiceVoiceStorage` and `RepoVoiceRecording` own uploaded-audio storage,
  metadata persistence, signed/public playback URL resolution, and provider
  switching between `LocalServer` and `GoogleCloud`.
- `ServiceMediaConversion` is part of the stored-audio conversion path used
  when WhatsApp delivery needs a gateway-friendly MP4 asset.
- `WhatsAppSchedulerWorker` plus `RepoWhatsAppSchedule` own the background
  scheduler flow and its send log table.

### Persistence and config dependencies

- Core tables used by the transaction flow:
  `Donatur`, `TRBirthdayPray`, and `Pendoa`.
- Scheduler tables:
  `WhatsAppScheduleSetting` and `TRBirthdayPrayWASendLog`.
- Voice metadata table:
  `VoiceRecordings`.
- Application setting table:
  `MsProg`.
- Deployment migration for the 2026-07-13 WABA setting columns:
  `scripts/database/2026-07-13-add-whatsapp-template-settings.sql`.
- Config sections that matter for this cluster:
  `Runtime`, `VoiceStorage`, `WhatsAppGateway`, and `MediaConversion`.
- `API/Program.cs` exposes local-server birthday audio under
  `/api/uploads/birthday-pray` and also wires `WhatsAppSchedulerWorker` as a
  hosted background service.

## 4. Workflow

### 4.1 Dashboard window

1. `Dashboard.tsx` computes `today` and calls `useFetchBirthdayDashboard(today)`.
2. The hook calls `getBirthdayDashboard(tgl)` in
   `client/src/service/trBirthdayPrayService.ts`.
3. `ControllerTRBirthdayPray.GetDashboard` normalizes `tgl` to `anchorDate`.
4. `ServiceTRBirthdayPray.GetUpcomingBirthdayDashboard` computes:
   `effectiveAnchorDate = anchorDate.Date` and
   `beginDate = effectiveAnchorDate.AddDays(BirthdayDashboardBeginDateOffsetDays)`.
5. `RepoTRBirthdayPray.GetUpcomingBirthdayDashboard` resolves each donor's
   birthday window, applies the lower bound from `beginDate`, and applies the
   upper bound from `DATEADD(MONTH, 6, @anchorDate)`.
6. `Dashboard.tsx` groups the returned rows by month and date on the client.

### 4.2 Exact-date and date-status APIs

- `UpcomingBirthdayByTgl` is the exact-date contract and must stay exact-date
  only.
- `GetDateStatuses` is the calendar/date-status API.
- Current repo search found controller/service/repo implementations for both,
  but no current frontend caller for `GetDateStatuses`.
- Current `Dashboard.tsx` builds its visible month/date grouping from
  `GetDashboard` data instead of calling `UpcomingBirthdayByTgl`.

### 4.3 Detail/load by donatur

1. `TRBirthdayPray.tsx` reads `idDonatur` from route params and uses
   `currentYear = new Date().getFullYear()`.
2. The page loads detail with `GetDataByDonatur(idDonatur, year)` and history
   with `GetHistoryByDonatur(idDonatur)`.
3. `ServiceTRBirthdayPray.GetDataByDonatur` defaults the target year to
   `DateTime.Today.Year` and resolves `pathPesanSuaraUrl` through
   `ResolveStoredAudioPreviewUrl`.
4. UI preview uses `buildMediaUrl(pathPesanSuaraUrl || pathPesanSuara)` for the
   saved asset, while history stays read-only.

### 4.4 Current UI save path

1. `TRBirthdayPray.tsx` validates message formatting, max length, and unsaved
   changes.
2. If the user picked or recorded new audio, the page uploads the file first to
   `POST api/voice/upload-mp3`.
3. The upload returns `voiceRecordingId`; the page then calls
   `PUT api/Transaction/TRBirthdayPray/Save`.
4. `ServiceTRBirthdayPray.Save` loads the donatur, loads the default `Pendoa`,
   computes the birthday date for the current year, and expands the target set
   when `saveToAllSameBirthdayDate` is `true`.
5. If `voiceRecordingId` is present, `Save` resolves the playback URL via
   `ServiceVoiceStorage.ResolvePlaybackUrl`; if `pesanSuaraFile` is present
   directly, `Save` stores it via `SaveVoiceFile`.
6. For each target donatur, the service updates the latest existing row or
   creates a new `TRBirthdayPray` row.

### 4.5 Voice-only backend paths

- `SaveVoice` and `SaveVoiceFFmpeg` are still valid backend contracts.
- Current repo search did not find a frontend caller for these endpoints.
- `SaveVoice` accepts MP3/MP4 style input and only updates/creates voice-path
  data.
- `SaveVoiceFFmpeg` supports wider audio formats, converts them through the
  FFmpeg-aware path, and can create a row with a default verse when only voice
  data exists.

### 4.6 Manual WhatsApp send

1. `TRBirthdayPray.tsx` blocks manual send if there are unsaved changes, missing
   audio, or invalid template inputs.
2. `SendWhatsApp` loads the latest detail row plus current application setting.
3. The service validates phone number, audio presence, gateway URL, template
   data, configured WhatsApp sender phone-number ID, the pendoa's international
   phone number, and public-base-URL requirements.
4. `EnsureWhatsAppMp4VoiceAsync` prepares a delivery-safe media URL and
   conversion output when needed.
5. A live `SendWhatsApp` attempt marks `IsWASent` before gateway validation,
   media conversion, or HTTP delivery; this status records that the procedure
   started and does not block a manual resend.
6. The service sends the WABA-approved `MsgWA_TemplateName` first with
   `MainTemplateLanguageCode` (currently `en_US`), waits briefly, then sends
   `MsgWA_VoiceTemplateName` as the audio follow-up with that same language.
   There is no legacy template, catalog lookup, fallback branch, or hardcoded
   runtime template name in this procedure.

### 4.7 Test send, media debug, and delivery-status lookup

- `SendTestWhatsAppText` is a gateway text probe with the same formatting rules.
- `SendTestWhatsAppVoice` is a gateway media probe and also tries to look up the
  latest outbound message status after the send request succeeds.
- `GetMediaDebugInfo` is the first diagnostic step for storage/provider/public
  URL issues. It returns public base URL, storage provider, root path,
  environment folder, preview URL, and delivery URL facts.
- `GetWhatsAppDeliveryStatus` reads conversation messages from the gateway and
  summarizes the latest outbound status. In debug mode it also returns parsing
  metadata such as normalized phone, message path, and fallback reasoning.

### 4.8 Dashboard send/status behavior

- Dashboard rows use `GetDashboard` data for completeness and `isWASent`.
- After a dashboard send action, the page can ask
  `GetWhatsAppDeliveryStatus` for the latest outbound gateway status and store
  the result client-side.
- Current dashboard auto-refreshes status lookup only for rows that already have
  `id_TRBirthdayPray` and `isWASent = true`.

### 4.9 Auto-send paths

There are two different "auto/manual batch" paths and they must not be merged
by assumption:

- `SendNextTodayWhatsApp` in `ControllerTRBirthdayPray` calls
  `ServiceTRBirthdayPray.SendNextTodayCompleteUnsentWhatsApp()`.
  This path finds one complete unsent candidate for today after 05:00 and then
  reuses the main `SendWhatsApp` flow.
- `WhatsAppSchedulerWorker` is the background worker path.
  It reads unsent due items from `RepoWhatsAppSchedule.GetDueDispatches(DateTime.Now)`,
  calls `ServiceTRBirthdayPray.SendScheduledWhatsApp`, and logs each attempt
  into `TRBirthdayPrayWASendLog`.

### 4.10 Scheduler setting flow

1. `WhatsAppSchedule.tsx` reads and updates `sendTime` and `isActive`.
2. `API/DatabaseVersioning/Main/2026071402__existing_runtime_schema.sql`
   idempotently creates/seeds `WhatsAppScheduleSetting` and
   `TRBirthdayPrayWASendLog`; `RepoWhatsAppSchedule` only consumes that schema.
3. The worker dispatches only when `IsActive = 1`, the run time is past
   `SendTime`, `IsWASent = 0`, and there is no prior successful log row for the
   same `id_TRBirthdayPray` and birthday date.

## 5. Stable Rules / Sharp Edges

- The voice save and WhatsApp send flow is considered stable. Do not rewrite
  `ServiceVoiceStorage` or the WhatsApp send flow in `ServiceTRBirthdayPray`
  unless the user explicitly asks for a code-flow change.
- Do not change MP3-to-MP4 conversion behavior, template payload shape, gateway
  send order, or `WASent` marking just to fix media URL issues.
- Troubleshoot media/gateway failures through configuration first:
  `Runtime.PublicBaseUrl`, `VoiceStorage.RootPath`,
  `VoiceStorage.EnvironmentFolder`, `WhatsAppGateway`, and the saved storage
  output.
- WhatsApp media URLs must be public absolute URLs. Never assume preview success
  in the browser means the gateway can fetch the same asset.
- Preview and delivery use different resolution goals:
  `ResolveStoredAudioPreviewUrl` is for UI playback, while
  `ResolveStoredAudioDeliveryUrl` is for third-party gateway delivery.
- The dashboard lower-bound rule is centralized in
  `ServiceTRBirthdayPray.BirthdayDashboardBeginDateOffsetDays`, which is
  currently `0`.
- `GetDataByDonatur`, save flows, send flows, and most birthday calculations
  default to the current server year when year is omitted.
- Donor-to-transaction matching in `RepoTRBirthdayPray` is name-based plus
  birthday-date-based in several queries:
  `LTRIM(RTRIM(t.Nama)) = LTRIM(RTRIM(d.Nama))` together with matching
  `BirthdayDate`.
  Do not treat `id_donatur` as the only join key without checking the existing
  query contract.
- `saveToAllSameBirthdayDate` defaults to `true` in request models.
  Any save-path change must preserve or intentionally replace this fan-out rule.
- Leap-day birthdays are normalized per target year in repo/service logic.
  Do not replace birthday-year calculation casually.
- Scheduler success and manual send success are tracked differently:
  `SendWhatsApp` can mark `TRBirthdayPray.IsWASent`,
  while `WhatsAppSchedulerWorker` writes `TRBirthdayPrayWASendLog`.
  Do not assume the log table is a mirror of `IsWASent`.
- `MsgWA_PhoneNumberId` is the non-secret sender ID used by
  `ServiceTRBirthdayPray` gateway payloads. Keep the field as
  `whatsapp_phone_number_id` directly after `message_type` in those payloads.
- `MsgWA_TemplateName` is the required WABA/Meta-approved main greeting
  template name. `MsgWA_VoiceTemplateName` is the required WABA/Meta-approved
  second audio template name. Both serialize with `language.code` from
  `MainTemplateLanguageCode` (currently `en_US`). The audio setting defaults to
  `doa_selamat_ulang_tahun` on new and migrated `MsProg` tables. A missing
  relevant name blocks the send before conversion or HTTP.
- `IsWASent` records that a live send procedure started. Manual resend is
  intentionally allowed even when it is already `1`; only scheduler selection
  and the scheduled-send claim require `IsWASent = 0`.
- `WhatsAppSchedulerWorker` must delegate delivery to
  `ServiceTRBirthdayPray.SendScheduledWhatsApp`; it has no independent gateway
  payload contract.
- The main birthday greeting template has exactly five body parameters in this
  order: donor name, pendoa name, link, prayer text, then pendoa phone number.
  `Pendoa.nohp` must be a valid international value such as `+628123456789`.
  The scheduler uses this same greeting payload; test text/voice and the
  voice follow-up do not add this body parameter.
- `GetDateStatuses` and `UpcomingBirthdayByTgl` are API contracts that should
  stay behaviorally stable even though current dashboard rendering is driven by
  `GetDashboard`.

## 6. Tracing Guide

| Scenario | Trace path | Notes |
| --- | --- | --- |
| Dashboard list | `Dashboard.tsx` -> `useFetchBirthdayDashboard` -> `getBirthdayDashboard` -> `ControllerTRBirthdayPray.GetDashboard` -> `ServiceTRBirthdayPray.GetUpcomingBirthdayDashboard` -> `RepoTRBirthdayPray.GetUpcomingBirthdayDashboard` | Main six-month window plus backend-controlled begin date. |
| Detail page load | `TRBirthdayPray.tsx` -> `useFetchTRBirthdayPrayByDonatur` -> `GetDataByDonatur` -> `ServiceTRBirthdayPray.GetDataByDonatur` -> `RepoTRBirthdayPray.GetDataByDonaturId` | Also resolves preview URL in service. |
| History load | `TRBirthdayPray.tsx` -> `useFetchTRBirthdayPrayHistoryByDonatur` -> `GetHistoryByDonatur` -> `RepoTRBirthdayPray.GetHistoryByDonaturId` | Orders by birthday date then created date. |
| Save from current UI | `TRBirthdayPray.tsx.handleSave` -> `api/voice/upload-mp3` -> `ControllerVoice.UploadMp3` -> `ServiceVoiceStorage.UploadMp3` -> `PUT Save` -> `ServiceTRBirthdayPray.Save` | Current UI does upload first, then save by `voiceRecordingId`. |
| Voice-only backend save | `ControllerTRBirthdayPray.SaveVoice` or `SaveVoiceFFmpeg` -> `ServiceTRBirthdayPray.SaveVoice*` | Supported API paths, but not the current page's primary save behavior. |
| Manual WhatsApp send | `TRBirthdayPray.tsx` or dashboard action -> `SendWhatsApp` -> `ServiceTRBirthdayPray.SendWhatsApp` -> gateway | This is the path that can mark `IsWASent`. |
| Media debug | `TRBirthdayPray.tsx.handleGetMediaDebugInfo` -> `GetMediaDebugInfo` -> `ServiceTRBirthdayPray.GetMediaDebugInfo` | First stop for public URL/storage issues. |
| Delivery status | `TRBirthdayPray.tsx` or `Dashboard.tsx` -> `GetWhatsAppDeliveryStatus` -> `ServiceTRBirthdayPray.GetWhatsAppDeliveryStatus` | Uses gateway conversation messages, not the send log table. |
| Scheduler worker | hosted service -> `WhatsAppSchedulerWorker` -> `RepoWhatsAppSchedule.GetDueDispatches` -> gateway -> `InsertSendLog` | Separate from manual send status tracking. |
| Scheduler config | `WhatsAppSchedule.tsx` -> schedule hook/service -> `RepoWhatsAppSchedule` | Controls send time and activation only. |
| Application config | `ApplicationSetting.tsx` -> setting hook/service -> `RepoApplicationSetting` | Feeds template, token, image, link, storage type, and sender phone-number ID behavior. |

## 7. Quality Gate Checklist

Before shipping any TRBirthdayPray change, verify these points:

- Confirm whether the change belongs to dashboard windowing, detail edit,
  voice handoff, manual send, status lookup, or scheduler flow.
- Check whether the current behavior is rooted in config, not code.
- Re-verify the route, hook, controller, service, repo, and table/query path
  before changing logic.
- Keep `GetDashboard`, `UpcomingBirthdayByTgl`, and `GetDateStatuses`
  semantics distinct.
- Preserve `saveToAllSameBirthdayDate` behavior unless the user explicitly asks
  to change fan-out scope.
- Preserve the separation between preview URLs and delivery URLs.
- Verify whether the change should affect `IsWASent`, `TRBirthdayPrayWASendLog`,
  both, or neither.
- If touching scheduler logic, check both `WhatsAppScheduleSetting` and
  `TRBirthdayPrayWASendLog`.
- If touching media delivery, test the generated URL as a public downloadable
  asset, not only as a local preview.
- If adding or renaming dependencies, update this file in the same task.
- For a resolved defect, update the incident ledger with a prevention rule and
  the verification evidence obtained in the task.
- For a suspected provider failure, record the classification and evidence
  separately from application bugs; do not change application flow merely to
  hide an external condition.

## 8. Self-Learning And Update Protocol

When the module changes or an investigation produces a proven finding, update
this file in the same task. This is the module's self-learning mechanism.

### Mandatory update triggers

Update the relevant section when any of these occur:

- a route, payload field, table, config key, service helper, worker behavior,
  or dependency changes;
- a defect's root cause is confirmed, including a gateway/provider or public
  media-access cause;
- a failure mode gains a validation, fallback, diagnostic, or regression guard;
- a manual QA, build, or runtime check exposes a verification gap a future
  agent must know about;
- the user approves a behavior change that supersedes an older module rule.

### Required learning workflow

1. **Classify** the observation as application logic, configuration/storage,
   gateway/provider, data, or unproven hypothesis.
2. **Trace** the UI/API/service/repository/worker route and the state that can
   change, such as media output, `IsWASent`, or scheduler logs.
3. **Prove** it through source, an API/runtime reproduction, public-media
   fetch, or manual UI evidence. Record the verification level explicitly.
4. **Prevent recurrence** with one actionable guardrail, diagnostic order, or
   QA/test check. Add a regression test when an appropriate seam exists;
   otherwise add a concrete quality-gate item.
5. **Write the learning** in the affected map/rule section and add a concise,
   dated incident or change entry. Do not add only a generic end summary.

### Verification labels

Use one or more of these labels in every new entry:

- **Code-verified**: traced in the current source tree.
- **Runtime-verified**: reproduced against a running API/UI without exposing
  secrets or donor data.
- **Provider-confirmed**: confirmed by a gateway/Meta response; re-check before
  treating it as permanent policy.
- **Manual QA pending**: source/build evidence exists, but the matching UI or
  media surface could not be exercised.

## 9. Incident Ledger And Regression Playbook

Start diagnosis with the listed order, then add a dated entry when a new root
cause is proven.

| Symptom / category | Diagnose first | Confirmed prevention rule |
| --- | --- | --- |
| `133010`, `PhoneNotRegistered`, or `Account not registered` on test text | Inspect normalized gateway error and sender/business registration state. | Treat it as sender/business registration or gateway synchronization, not a donor-number or template-path defect. `SendTestWhatsAppText` remains a real `message_type: text` probe. |
| `WindowClosed` gateway response | Inspect the gateway error mapping and conversation-window context. | This is the 24-hour messaging-window condition; use the established template flow rather than rewriting the text payload. |
| Meta `131053` or media upload/fetch failure | Call media debug, then verify the exact delivery URL is public, downloadable without login, and returns the intended media. | Fix public URL/storage configuration first. Do not change duration or MP3-to-MP4 behavior until reachability and content are proven. |
| Delivery status is `UNKNOWN` | Use `GetWhatsAppDeliveryStatus?debug=true` and inspect normalized phone, message-array path, and outbound/inbound parsing counts. | Distinguish no outbound message from parsing fallback; do not infer a gateway result from `IsWASent` alone. |
| Settings cannot persist `MsgWA_PhoneNumberId` | Confirm the additive `MsProg` column migration completed. | Return the DBA-migration error; never discard the sender ID. A blank ID blocks conversion and gateway HTTP after the live send status is recorded. |
| Main or audio template name is blank | Inspect `MsgWA_TemplateName` and `MsgWA_VoiceTemplateName` in Application Setting. | Both names must be WABA/Meta-approved and use `MainTemplateLanguageCode` (currently `en_US`). The relevant stage must stop before conversion or gateway HTTP; never substitute a legacy or hardcoded template name. |
| Main template rejects a body parameter or pendoa phone is missing | Verify `Pendoa.nohp` is normalized/valid and inspect the configured new template. | The greeting template requires exactly five body placeholders; keep pendoa validation in both Master UI and API. |

### Incident entry template

```md
### YYYY-MM-DD - Incident: short symptom

- Classification: application / configuration-storage / gateway-provider / data
- Symptom and scope:
- Trace and affected state:
- Confirmed root cause or condition:
- Prevention / regression guard:
- Evidence: Code-verified / Runtime-verified / Provider-confirmed / Manual QA pending
- Source of truth:
```

## 10. Change Entry Template

Use this template for future notes:

```md
### YYYY-MM-DD - Short title

- Change:
- Why:
- Source of truth:
- Risk / sharp edge:
- Verification:
```

## 11. Recent Notes

### 2026-07-02 - Module knowledge base created

- Change: Added the canonical TRBirthdayPray scoped rulebook under
  `docs/module-agents/TRBirthdayPray/AGENTS.md`.
- Why: Future agents need one entrypoint for dashboard, transaction,
  voice-handoff, WhatsApp, and scheduler tracing.
- Source of truth: Code-verified against current controller, service, repo,
  page, hook, setting, and worker files.
- Verification: Repo search and file inspection only; no runtime QA performed.

### 2026-07-02 - Dashboard begin-date source of truth

- Change: Documented that dashboard lower-bound control is centralized in
  `ServiceTRBirthdayPray.BirthdayDashboardBeginDateOffsetDays`.
- Why: Future begin-date changes should be made in one backend constant instead
  of spreading logic across UI, controller, and SQL blindly.
- Source of truth: `ServiceTRBirthdayPray.GetUpcomingBirthdayDashboard` and
  `RepoTRBirthdayPray.GetUpcomingBirthdayDashboard`.
- Verification: Code-verified.

### 2026-07-02 - Manual send and scheduler send are different flows

- Change: Documented the distinction between `IsWASent` tracking and
  `TRBirthdayPrayWASendLog`.
- Why: This module has both service-driven send and worker-driven dispatch, and
  they do not use the same status storage.
- Source of truth: `ServiceTRBirthdayPray.SendWhatsApp`,
  `ServiceTRBirthdayPray.SendNextTodayCompleteUnsentWhatsApp`,
  `WhatsAppSchedulerWorker`, and `RepoWhatsAppSchedule`.
- Verification: Code-verified.

### 2026-07-02 - Calendar/status endpoints are preserved contracts

- Change: Recorded that `UpcomingBirthdayByTgl` and `GetDateStatuses` remain
  stable API contracts even though the current dashboard page groups visible data
  from `GetDashboard`.
- Why: Future UI changes should not repurpose these endpoints casually.
- Source of truth: `ControllerTRBirthdayPray`, `ServiceTRBirthdayPray`,
  `RepoTRBirthdayPray`, and current frontend repo search.
- Verification: Code-verified; current frontend caller for `GetDateStatuses`
  not found in repo search.

### 2026-07-13 - Configurable WhatsApp sender phone-number ID

- Change: Added `MsProg.MsgWA_PhoneNumberId` and the Application Setting field
  as the source for `whatsapp_phone_number_id` in every
  `ServiceTRBirthdayPray` manual and test gateway payload.
- Why: The gateway requires the sender ID to be supplied with the message.
- Source of truth: `RepoApplicationSetting`, `ServiceTRBirthdayPray`, and
  `ApplicationSetting.tsx`.
- Risk / sharp edge: A blank ID blocks media conversion and gateway HTTP after
  a live procedure has recorded `IsWASent`. Scheduler uses the shared service
  package.
- Verification: API and client builds passed; test-text dry-run serialized the
  configured field. Template and voice dry-runs still require a saved test
  recording.

### 2026-07-13 - Unified main-template and audio send package

- Change: Live manual send now marks `IsWASent` at procedure start, always
  sends the configured main template followed by the configured audio template,
  and no longer selects a legacy template path. The concrete template names are
  defined by the later WABA-setting entry.
  Manual resend remains valid when `IsWASent = 1`.
- Why: The greeting and audio must be one ordered send procedure, while the
  status records a started attempt instead of a confirmed gateway delivery.
- Source of truth: `ServiceTRBirthdayPray`, `WhatsAppSchedulerWorker`,
  `RepoTRBirthdayPray`, and `RepoWhatsAppSchedule`.
- Risk / sharp edge: Scheduler dispatch remains restricted to unsent rows and
  uses an atomic `IsWASent = 0` claim; a gateway failure after status marking
  requires a deliberate manual resend or business-status reset.
- Verification: Code-verified; API/client builds passed and local
  `DebugSendWhatsApp` dry-run verified both ordered template payloads without
  changing `IsWASent` or contacting the gateway.

### 2026-07-13 - WhatsApp and TRBirthdayPray living knowledge base

- Change: Expanded this rulebook with a learning charter, evidence labels,
  mandatory update triggers, incident ledger, and regression-playbook template.
- Why: Future fixes must retain proven workflow, configuration, and
  gateway/provider findings instead of rediscovering the same issue.
- Source of truth: Current module source, root voice/media guardrails, and
  previously runtime-verified gateway diagnosis notes.
- Risk / sharp edge: Record only proven, non-sensitive evidence. Keep a
  provider condition separate from an application defect and re-verify
  drift-prone gateway behavior.
- Verification: Documentation structure, root guardrails, and prior
  runtime-verified gateway findings were reviewed; no runtime behavior changed
  in this documentation-only update.

### 2026-07-13 - Pendoa phone as main-template parameter five

- Change: Added the normalized `Pendoa.nohp` as the fifth and final parameter
  for the birthday greeting template.
- Why: The greeting template must expose the pendoa contact after the existing
  donor, pendoa name, link, and prayer-text values.
- Source of truth: `ServiceMasterPendoa` validates the stored number;
  `ServiceTRBirthdayPray` validates it before media work and serializes it in
  the main-template body.
- Risk / sharp edge: Keep the video follow-up and test payloads unchanged.
  Scheduler uses the same main-template contract.
- Verification: Code-verified; API/client builds passed and the local
  `DebugSendWhatsApp` dry-run confirmed five body parameters.

### 2026-07-13 - Configurable WABA main and voice template names

- Change: `MsProg.MsgWA_TemplateName` is now the runtime main-template name
  with `en_US`, while the new `MsProg.MsgWA_VoiceTemplateName` is the runtime
  audio follow-up name with `en`; the latter defaults to
  `doa_selamat_ulang_tahun` for new and migrated settings tables.
- Why: Template names must be managed from Master Setting and must match the
  WABA/Meta-approved templates instead of being hardcoded in the send service.
- Source of truth: `RepoApplicationSetting`, `ServiceTRBirthdayPray`, and
  `ApplicationSetting.tsx`.
- Risk / sharp edge: A blank relevant name rejects the package before media
  conversion or gateway HTTP. Preserve the main-to-audio order and do not add a
  legacy fallback.
- Verification: Code-verified and Runtime-verified. API/client builds passed;
  Application Setting GET/PUT round-tripped both names, and local
  `DebugSendWhatsApp(runLive: false)` confirmed the main setting name with
  `en_US`, the voice setting name with `en`, the sender ID, five main body
  parameters, and no gateway HTTP request.

### 2026-08-11 - Voice template language follows main template language

- Change: The follow-up voice payload and its debug-stage result use
  `MainTemplateLanguageCode` (currently `en_US`), not a separate voice-only
  language constant.
- Why: Main and voice templates must be sent with the same language code.
- Source of truth: `ServiceTRBirthdayPray.BuildVoiceTemplatePayload` and the
  follow-up voice stage in `ExecuteWhatsAppSendAsync`.
- Risk / sharp edge: Preserve configured template names, media header,
  main-to-voice send order, and `IsWASent` behavior.
- Verification: Runtime dry-run confirmed both templates use `en_US`; a live
  send remains subject to the gateway's sender-account registration.
