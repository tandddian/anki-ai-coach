/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEV_SERVER_URL?: string;
  readonly VITE_AI_API_KEY?: string;
  readonly VITE_AI_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
