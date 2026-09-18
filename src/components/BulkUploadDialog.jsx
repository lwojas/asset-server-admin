import { useRef, useState } from "react";
import * as assetServer from "../api/assetServer";
import { ASSET_PROJECT, ASSET_TYPES, DEFAULT_SPRITESHEET_FRAME_SIZE } from "../config";
import { useToast } from "../hooks/useToast.jsx";
import { joinPath, keyFromFilename } from "../utils/format";
import { Modal } from "./Modal.jsx";

let nextRowId = 1;

function filesToRows(fileList) {
  return Array.from(fileList).map((file) => ({
    id: nextRowId++,
    file,
    assetKey: keyFromFilename(file.name),
    included: true,
    status: "pending", // pending | uploading | done | error
    error: null,
  }));
}

export function BulkUploadDialog({ onClose, onUploaded }) {
  const { notify } = useToast();
  const fileInputRef = useRef(null);

  const [type, setType] = useState("image");
  const [sharedPath, setSharedPath] = useState("");
  const [frameWidth, setFrameWidth] = useState(DEFAULT_SPRITESHEET_FRAME_SIZE);
  const [frameHeight, setFrameHeight] = useState(DEFAULT_SPRITESHEET_FRAME_SIZE);
  const [rows, setRows] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const isSpritesheet = type === "spritesheet";
  const includedRows = rows.filter((r) => r.included);
  const canUpload = includedRows.length > 0 && !uploading;

  function handleFilesSelected(e) {
    const list = e.target.files;
    if (!list || list.length === 0) return;
    setRows(filesToRows(list));
    setFinished(false);
    setUploadedCount(0);
  }

  function updateRow(id, patch) {
    setRows((current) => current.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function toggleRow(id) {
    updateRow(id, { included: !rows.find((r) => r.id === id)?.included });
  }

  async function handleUpload() {
    setUploading(true);
    setFinished(false);
    setUploadedCount(0);
    let successCount = 0;
    let failureCount = 0;

    for (const row of rows) {
      if (!row.included) continue;
      updateRow(row.id, { status: "uploading", error: null });
      try {
        const formData = new FormData();
        formData.append("file", row.file);
        formData.append("assetKey", row.assetKey.trim());
        formData.append("type", type);
        formData.append("path", joinPath(sharedPath, row.file.name));
        if (isSpritesheet) {
          formData.append("frameWidth", String(frameWidth));
          formData.append("frameHeight", String(frameHeight));
        }
        const asset = await assetServer.addAsset(ASSET_PROJECT, formData);
        updateRow(row.id, { status: "done" });
        onUploaded(asset);
        successCount += 1;
      } catch (err) {
        updateRow(row.id, { status: "error", error: err.message || "Upload failed" });
        failureCount += 1;
      } finally {
        setUploadedCount((n) => n + 1);
      }
    }

    setUploading(false);
    setFinished(true);
    if (failureCount === 0) {
      notify(`✓ ${successCount} asset${successCount === 1 ? "" : "s"} uploaded`);
    } else {
      notify(`${successCount} uploaded, ${failureCount} failed`, { tone: "error", duration: 6000 });
    }
  }

  const progressPct = rows.length ? Math.round((uploadedCount / includedRows.length) * 100) : 0;

  return (
    <Modal
      title="Bulk Upload"
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            {finished ? "Close" : "Cancel"}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleUpload} disabled={!canUpload}>
            {uploading
              ? `Uploading ${uploadedCount} / ${includedRows.length}`
              : `Upload ${includedRows.length || ""} Asset${includedRows.length === 1 ? "" : "s"}`}
          </button>
        </>
      }
    >
      <div className="form-field">
        <label htmlFor="bulk-type">Type</label>
        <select
          id="bulk-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          disabled={uploading}
        >
          {ASSET_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <span className="hint">All files in this batch are uploaded as this type.</span>
      </div>

      <div className="form-field">
        <label htmlFor="bulk-path">Shared path / folder (optional)</label>
        <input
          id="bulk-path"
          type="text"
          value={sharedPath}
          onChange={(e) => setSharedPath(e.target.value)}
          placeholder="npc"
          disabled={uploading}
        />
        <span className="hint">Each file uploads to this folder using its own filename.</span>
      </div>

      {isSpritesheet && (
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="bulk-frame-width">Frame width</label>
            <input
              id="bulk-frame-width"
              type="number"
              min="1"
              value={frameWidth}
              onChange={(e) => setFrameWidth(e.target.value)}
              disabled={uploading}
            />
          </div>
          <div className="form-field">
            <label htmlFor="bulk-frame-height">Frame height</label>
            <input
              id="bulk-frame-height"
              type="number"
              min="1"
              value={frameHeight}
              onChange={(e) => setFrameHeight(e.target.value)}
              disabled={uploading}
            />
          </div>
        </div>
      )}
      <span className="hint" style={{ display: "block", marginTop: -8, marginBottom: 14 }}>
        {isSpritesheet && "Applied to every file in this batch — edit individual assets afterward if needed."}
      </span>

      <div className="form-field">
        <label>Files</label>
        <label className="file-drop">
          <input ref={fileInputRef} type="file" multiple onChange={handleFilesSelected} disabled={uploading} />
          {rows.length > 0 ? (
            <div className="file-name">{rows.length} file(s) selected</div>
          ) : (
            <div>Click to choose files</div>
          )}
        </label>
      </div>

      {rows.length > 0 && (
        <div className="bulk-file-list">
          {rows.map((row) => (
            <div className="bulk-file-row" key={row.id}>
              <input
                type="checkbox"
                checked={row.included}
                onChange={() => toggleRow(row.id)}
                disabled={uploading}
                aria-label={`Include ${row.file.name}`}
              />
              <span className="file-name" title={row.file.name}>
                {row.file.name}
              </span>
              <input
                type="text"
                value={row.assetKey}
                onChange={(e) => updateRow(row.id, { assetKey: e.target.value })}
                disabled={uploading || row.status === "done"}
              />
              <span className={`bulk-status ${row.status}`}>
                {row.status === "pending" && "Pending"}
                {row.status === "uploading" && "Uploading…"}
                {row.status === "done" && "✓ Uploaded"}
                {row.status === "error" && "Failed"}
              </span>
              {row.status === "error" && <div className="bulk-error-detail">{row.error}</div>}
            </div>
          ))}
        </div>
      )}

      {(uploading || finished) && (
        <div className="bulk-progress">
          <div className="bulk-progress-bar">
            <div className="bulk-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="bulk-progress-label">
            Uploading {uploadedCount} / {includedRows.length}
          </div>
        </div>
      )}
    </Modal>
  );
}
