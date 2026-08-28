---
slug: whatsapp-new6-combined-template
status: approved
intent: clear
pending-action: execute .omo/plans/whatsapp-new6-combined-template.md
approach: Route only ucapan_ulang_tahun_new6 to a one-stage video-header main template; preserve existing behavior for every other template.
---

# Draft: whatsapp-new6-combined-template

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->
1 | template routing and payload | active | API/Service/Transaction/ServiceTRBirthdayPray.cs
2 | regression and dry-run verification | active | API.Tests and .omo/evidence/whatsapp-new6-combined-template
3 | module knowledge base | active | docs/module-agents/TRBirthdayPray/AGENTS.md

## Open assumptions (announced defaults)
<!-- Record any default you adopt instead of asking, so the user can veto it at the gate. -->
<!-- assumption | adopted default | rationale | reversible? -->
Unrecognized main template names | preserve existing image + voice follow-up behavior | backward compatibility | yes
new6 WABA contract | VIDEO header plus same five body parameters | explicitly approved user plan | yes

## Findings (cited - path:lines)
- Existing main payload uses an IMAGE header and five ordered text body values: `API/Service/Transaction/ServiceTRBirthdayPray.cs:3087`, `API/Service/Transaction/ServiceTRBirthdayPray.cs:3178`.
- Existing voice payload already uses a VIDEO header with the MP4 delivery URL: `API/Service/Transaction/ServiceTRBirthdayPray.cs:3211`.
- MP3-to-MP4 delivery preparation is centralized and must remain unchanged: `API/Service/Transaction/ServiceTRBirthdayPray.cs:3968`.

## Decisions (with rationale)
- Recognize new6 after the service's existing template-name normalization semantics.
- Skip voice-template validation, delay, and second request only for new6 because audio is embedded in the main VIDEO header.
- Tests-after selected by the user, with failing-first proof captured before production edits.

## Scope IN
- Service routing/payload change, focused API tests, dry-run evidence, scoped module documentation.

## Scope OUT (Must NOT have)
- Voice storage/conversion rewrites, database/frontend/controller/request changes, scheduler/status ordering changes, live gateway sends.

## Open questions
- None.

## Approval gate
status: approved
<!-- When exploration is exhausted and unknowns are answered, set status: awaiting-approval. -->
<!-- That durable record is the loop guard: on a later turn read it and resume at the gate instead of re-running exploration. -->
