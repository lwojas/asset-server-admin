import { useRef, useState } from "react";
import * as assetServer from "../api/assetServer";
import { ASSET_PROJECT, ASSET_TYPES, DEFAULT_SPRITESHEET_FRAME_SIZE } from "../config";
import { useToast } from "../hooks/useToast.jsx";
import { keyFromFilename } from "../utils/format";
import { Modal } from "./Modal.jsx";

const ACCEPT_BY_TYPE = {
  image: "image/*",
  spritesheet: "image/*",
  audio: "audio/*",
};

export function UploadDialog({ onClose, onUploaded }) {
  const { notify } = useToast();
  const fileInputRef = useRef(null);

  const [type, setType] = useState("image");
  const [file, setFile] = useState(null);
  const [assetKey, setAssetKey] = useState("");
  const [path, setPath] = useState("");
  const [frameWidth, setFrameWidth] = useState(DEFAULT_SPRITESHEET_FRAME_SIZE);
  const [frameHeight, setFrameHeight] = useState(DEFAULT_SPRITESHEET_FRAME_SIZE);
  const [keyTouched, setKeyTouched] = useState(false);
  const [pathTouched, setPathTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function handleFileChange(e) {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) {
      if (!keyTouched) setAssetKey(keyFromFilename(selected.name));
      if (!pathTouched) setPath(selected.name);
    }
  }

  const isSpritesheet = type === "spritesheet";
  const canSubmit =
    file &&
    assetKey.trim() &&
    path.trim() &&
    (!isSpritesheet || (Number(frameWidth) > 0 && Number(frameHeight) > 0));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("assetKey", assetKey.trim());
      formData.append("type", type);
      formData.append("path", path.trim());
      if (isSpritesheet) {
        formData.append("frameWidth", String(frameWidth));
        formData.append("frameHeight", String(frameHeight));
      }
      const asset = await assetServer.addAsset(ASSET_PROJECT, formData);
      notify("✓ Asset uploaded");
      onUploaded(asset);
      onClose();
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title="Add Asset"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" form="add-asset-form" className="btn btn-primary" disabled={!canSubmit || submitting}>
            {submitting ? "Uploading…" : "Upload Asset"}
          </button>
        </>
      }
    >
      <form id="add-asset-form" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <div className="form-field">
          <label htmlFor="asset-type">Type</label>
          <select id="asset-type" value={type} onChange={(e) => setType(e.target.value)}>
            {ASSET_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>File</label>
          <label className="file-drop">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_BY_TYPE[type]}
              onChange={handleFileChange}
            />
            {file ? (
              <div className="file-name">{file.name}</div>
            ) : (
              <div>Click to choose a file</div>
            )}
          </label>
        </div>

        <div className="form-field">
          <label htmlFor="asset-key">Asset key</label>
          <input
            id="asset-key"
            type="text"
            value={assetKey}
            onChange={(e) => {
              setAssetKey(e.target.value);
              setKeyTouched(true);
            }}
            placeholder="wallTexture"
          />
        </div>

        <div className="form-field">
          <label htmlFor="asset-path">Path</label>
          <input
            id="asset-path"
            type="text"
            value={path}
            onChange={(e) => {
              setPath(e.target.value);
              setPathTouched(true);
            }}
            placeholder="textures/wall.png"
          />
          <span className="hint">Destination path within the project's asset storage.</span>
        </div>

        {isSpritesheet && (
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="frame-width">Frame width</label>
              <input
                id="frame-width"
                type="number"
                min="1"
                value={frameWidth}
                onChange={(e) => setFrameWidth(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="frame-height">Frame height</label>
              <input
                id="frame-height"
                type="number"
                min="1"
                value={frameHeight}
                onChange={(e) => setFrameHeight(e.target.value)}
              />
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
