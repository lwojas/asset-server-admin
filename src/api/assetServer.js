// Thin client around the Raycaster Asset Server HTTP contract.
// This module is the only place that knows about the server's URLs and
// request/response shapes. See docs/README.md for the authoritative contract.
import { ASSET_SERVER_URL } from "../config";

class AssetServerError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "AssetServerError";
    this.status = status;
  }
}

async function handleResponse(res) {
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const data = await res.clone().json();
      if (data && (data.message || data.error)) {
        message = data.message || data.error;
      }
    } catch {
      try {
        const text = await res.text();
        if (text) message = text;
      } catch {
        // ignore — fall back to the generic status message
      }
    }
    throw new AssetServerError(message, res.status);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function projectAssetsUrl(projectId) {
  return `${ASSET_SERVER_URL}/projects/${encodeURIComponent(projectId)}/assets`;
}

function projectAssetUrl(projectId, assetKey) {
  return `${projectAssetsUrl(projectId)}/${encodeURIComponent(assetKey)}`;
}

// Resolves a server-relative asset `location` into a fully-qualified URL.
export function resolveAssetUrl(location) {
  if (!location) return null;
  if (/^https?:\/\//i.test(location)) return location;
  return `${ASSET_SERVER_URL}${location.startsWith("/") ? "" : "/"}${location}`;
}

export async function checkHealth() {
  const res = await fetch(`${ASSET_SERVER_URL}/health`);
  return handleResponse(res);
}

export async function getAllAssets(projectId) {
  const res = await fetch(projectAssetsUrl(projectId));
  return handleResponse(res);
}

export async function getAsset(projectId, assetKey) {
  const res = await fetch(projectAssetUrl(projectId, assetKey));
  return handleResponse(res);
}

// `formData` must contain: file, assetKey, type, path, and (for spritesheets)
// frameWidth / frameHeight, per the documented multipart contract.
export async function addAsset(projectId, formData) {
  const res = await fetch(projectAssetsUrl(projectId), {
    method: "POST",
    body: formData,
  });
  return handleResponse(res);
}

export async function removeAsset(projectId, assetKey) {
  const res = await fetch(projectAssetUrl(projectId, assetKey), {
    method: "DELETE",
  });
  return handleResponse(res);
}

// Fetches the raw bytes currently stored for an asset, so they can be
// re-submitted via addAsset when metadata needs to change. The server has no
// in-place update endpoint — the documented replacement workflow is
// delete + re-add.
export async function fetchAssetFile(location) {
  const url = resolveAssetUrl(location);
  const res = await fetch(url);
  if (!res.ok) {
    throw new AssetServerError(
      `Could not download the current asset file (status ${res.status})`,
      res.status,
    );
  }
  return res.blob();
}

export { AssetServerError };
