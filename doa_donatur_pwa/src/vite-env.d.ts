/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_PWA_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
