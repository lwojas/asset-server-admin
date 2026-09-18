import { useEffect, useState } from "react";
import * as assetServer from "../api/assetServer";
import { ASSET_PROJECT } from "../config";
import { useToast } from "../hooks/useToast.jsx";
import { formatBytes, filenameFromPath, pathFromLocation } from "../utils/format";
import { AssetThumbnail, TypeBadge } from "./AssetThumbnail.jsx";
import { ConfirmDialog } from "./ConfirmDialog.jsx";
import { BackIcon } from "./icons.jsx";

function buildDraft(asset) {
  return {
    assetKey: asset.assetKey,
    frameWidth: asset.frameWidth ?? "",
    frameHeight: asset.frameHeight ?? "",
  };
}

export function AssetDetail({ asset, onBack, onDeleted, onSaved, onPendingRetryChange }) {
  const { notify } = useToast();
  const [draft, setDraft] = useState(() => buildDraft(asset));
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingSave, setConfirmingSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingRetry, setPendingRetry] = useState(null);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    setDraft(buildDraft(asset));
    setPendingRetry(null);
    setSaveError(null);
  }, [asset.assetKey]);

  useEffect(() => {
    onPendingRetryChange?.(Boolean(pendingRetry));
  }, [pendingRetry, onPendingRetryChange]);

  const isSpritesheet = asset.type === "spritesheet";
  const dirty =
    draft.assetKey !== asset.assetKey ||
    (isSpritesheet &&
      (String(draft.frameWidth) !== String(asset.frameWidth) ||
        String(draft.frameHeight) !== String(asset.frameHeight)));

  const previewUrl = assetServer.resolveAssetUrl(asset.location);

  function updateDraft(patch) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  async function performReupload() {
    setSaving(true);
    setSaveError(null);

    const path = pendingRetry?.path ?? pathFromLocation(asset.location, ASSET_PROJECT);
    const originalKey = pendingRetry?.originalKey ?? asset.assetKey;
    let file = pendingRetry?.file ?? null;
    let deleted = pendingRetry?.deleted ?? false;

    try {
      if (!file) {
        const blob = await assetServer.fetchAssetFile(asset.location);
        const filename = asset.originalFilename || filenameFromPath(asset.location);
        file = new File([blob], filename, { type: asset.mimeType || blob.type });
      }

      if (!deleted) {
        await assetServer.removeAsset(ASSET_PROJECT, originalKey);
        deleted = true;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("assetKey", draft.assetKey);
      formData.append("type", asset.type);
      formData.append("path", path);
      if (isSpritesheet) {
        formData.append("frameWidth", String(draft.frameWidth));
        formData.append("frameHeight", String(draft.frameHeight));
      }

      const updated = await assetServer.addAsset(ASSET_PROJECT, formData);
      setPendingRetry(null);
      notify("✓ Asset saved");
      onSaved(originalKey, updated);
    } catch (err) {
      // Keep whatever we already fetched/deleted so a retry can pick up
      // where this attempt left off, instead of re-fetching a file that
      // may no longer exist on the server once the delete has succeeded.
      setPendingRetry({ file, path, originalKey, deleted });
      setSaveError(
        deleted
          ? `The original asset "${originalKey}" was already removed and the re-upload failed: ${
              err.message || "unknown error"
            }. Retry below before leaving this screen.`
          : err.message || "Could not save this asset.",
      );
      notify(`Could not save "${draft.assetKey}". ${err.message || ""}`.trim(), {
        tone: "error",
        duration: 6000,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await assetServer.removeAsset(ASSET_PROJECT, asset.assetKey);
      notify("✓ Asset deleted");
      onDeleted(asset.assetKey);
    } catch (err) {
      notify(`Could not delete "${asset.assetKey}". ${err.message || ""}`.trim(), {
        tone: "error",
        duration: 6000,
      });
      throw err;
    } finally {
      setConfirmingDelete(false);
    }
  }

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <button type="button" className="btn btn-icon btn-ghost" onClick={onBack} aria-label="Back to list">
          <BackIcon width={16} height={16} />
        </button>
        <div className="detail-title">
          <h2>{asset.assetKey}</h2>
        </div>
        <TypeBadge type={asset.type} />
      </div>

      <div className="detail-body">
        {asset.type === "audio" ? (
          <div className="detail-preview">
            <div className="audio-preview">
              <AssetThumbnail asset={asset} />
              <audio controls src={previewUrl} />
            </div>
          </div>
        ) : (
          <div className="detail-preview">
            <img src={previewUrl} alt={asset.assetKey} />
          </div>
        )}

        <div className="field-group">
          <h3>File information</h3>
          <div className="field-row">
            <span className="field-label">Location</span>
            <span className="field-value mono">{asset.location}</span>
          </div>
          {asset.originalFilename && (
            <div className="field-row">
              <span className="field-label">Original filename</span>
              <span className="field-value">{asset.originalFilename}</span>
            </div>
          )}
          {asset.mimeType && (
            <div className="field-row">
              <span className="field-label">MIME type</span>
              <span className="field-value mono">{asset.mimeType}</span>
            </div>
          )}
          {asset.size != null && (
            <div className="field-row">
              <span className="field-label">Size</span>
              <span className="field-value">{formatBytes(asset.size)}</span>
            </div>
          )}
          {asset.id && (
            <div className="field-row">
              <span className="field-label">Server ID</span>
              <span className="field-value mono">{asset.id}</span>
            </div>
          )}
        </div>

        <div className="field-group">
          <h3>Editable metadata</h3>
          <div className="editable-field">
            <label htmlFor="assetKey">
              Asset key <span className="pill-tag">editable</span>
            </label>
            <input
              id="assetKey"
              type="text"
              value={draft.assetKey}
              onChange={(e) => updateDraft({ assetKey: e.target.value })}
            />
          </div>

          {isSpritesheet && (
            <div className="frame-dims">
              <div className="editable-field">
                <label htmlFor="frameWidth">
                  Frame width <span className="pill-tag">editable</span>
                </label>
                <input
                  id="frameWidth"
                  type="number"
                  min="1"
                  value={draft.frameWidth}
                  onChange={(e) => updateDraft({ frameWidth: e.target.value })}
                />
              </div>
              <div className="editable-field">
                <label htmlFor="frameHeight">
                  Frame height <span className="pill-tag">editable</span>
                </label>
                <input
                  id="frameHeight"
                  type="number"
                  min="1"
                  value={draft.frameHeight}
                  onChange={(e) => updateDraft({ frameHeight: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="edit-note">
            {pendingRetry
              ? "The previous asset was removed but re-uploading the new version failed. Press Save to retry the upload using the file already downloaded."
              : "The asset server has no in-place metadata update — saving deletes the existing asset and re-uploads it with the new values."}
          </div>
          {saveError && <div className="form-error" style={{ marginTop: 8 }}>{saveError}</div>}
        </div>
      </div>

      <div className="detail-footer">
        <button type="button" className="btn btn-danger" onClick={() => setConfirmingDelete(true)}>
          Delete
        </button>
        <div className="primary-actions">
          {dirty && !pendingRetry && (
            <button
              type="button"
              className="btn"
              onClick={() => setDraft(buildDraft(asset))}
              disabled={saving}
            >
              Reset
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            disabled={(!dirty && !pendingRetry) || saving}
            onClick={() => setConfirmingSave(true)}
          >
            {saving ? "Saving…" : pendingRetry ? "Retry Save" : "Save"}
          </button>
        </div>
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          title="Delete asset"
          message={`Delete "${asset.assetKey}"? This removes the registry entry and the stored file. This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}

      {confirmingSave && (
        <ConfirmDialog
          title="Save changes"
          message="Saving will remove the current asset and re-upload it with the updated metadata (delete + re-add). Continue?"
          confirmLabel="Save"
          onConfirm={async () => {
            await performReupload();
            setConfirmingSave(false);
          }}
          onCancel={() => setConfirmingSave(false)}
        />
      )}
    </div>
  );
}
