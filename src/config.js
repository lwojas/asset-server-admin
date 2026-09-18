// Application configuration. The asset server URL and project are supplied
// through environment/build configuration, never selected in the UI.
//
// In dev mode, requests go through the Vite dev server's proxy (see
// vite.config.js) instead of directly to VITE_ASSET_SERVER_URL, because the
// asset server does not currently send CORS headers — a direct cross-origin
// fetch from the browser is rejected. Production builds call
// VITE_ASSET_SERVER_URL directly and need the asset server (or a reverse
// proxy in front of it) to allow cross-origin requests from this app's origin.
export const ASSET_SERVER_URL = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_ASSET_SERVER_URL || "http://localhost:3002").replace(/\/+$/, "");

export const ASSET_PROJECT = import.meta.env.VITE_ASSET_PROJECT || "raycaster";

export const ASSET_TYPES = ["image", "spritesheet", "audio"];

export const DEFAULT_SPRITESHEET_FRAME_SIZE = 32;
