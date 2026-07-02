# Agent Guardrails

## Voice Storage And WhatsApp Media

The voice save and WhatsApp send flow in `WEB DOA` is considered stable. Do not
change the process or business logic unless the user explicitly asks for a code
flow change.

Keep these rules when working on voice or WhatsApp media:

- Do not rewrite the save voice flow in `ServiceVoiceStorage`.
- Do not rewrite the send voice/send WhatsApp flow in `ServiceTRBirthdayPray`.
- Do not change MP3-to-MP4 conversion behavior, template payload shape, gateway
  send order, or `WASent` marking just to fix media URL issues.
- For Development WhatsApp media tests, use configuration to point local voice
  storage to the public GTC server storage.
- `API/appsettings.Development.json` should keep:
  - `Runtime:PublicBaseUrl` as the public API URL, for example
    `https://yobel.intsoftware.co.id/api`.
  - `VoiceStorage:RootPath` as
    `\\gtc-server\DOAWEB\api\wwwroot\uploads\birthday-pray`.
  - `VoiceStorage:EnvironmentFolder` as `prod` when dev saves need to be visible
    from the production/public domain.
- WhatsApp/Meta media URLs must be public URLs. Never send `localhost`,
  `127.0.0.1`, private LAN URLs, or local-only API hosts as media URLs.
- If gateway returns Meta error `131053` or media upload errors, first verify the
  generated media URL is public, downloadable without login, and returns the
  correct media content. Do not assume the recording duration is the issue.

Before changing code around this area, inspect current config and storage output
first. Prefer config-only fixes when the problem is a local/public URL mismatch.

## Module Knowledge Bases

- `docs/module-agents/TRBirthdayPray/AGENTS.md` is the canonical module
  rulebook for the `TRBirthdayPray` cluster.
- Keep this root file focused on cross-module guardrails for voice storage and
  WhatsApp media.
- Put workflow, tracing, dependency, and module-specific update notes for
  `TRBirthdayPray` in the scoped knowledge base instead of duplicating them here.
