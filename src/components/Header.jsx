import { ASSET_PROJECT } from "../config";
import { PlusIcon, RefreshIcon, StackIcon } from "./icons.jsx";
import { ThemeToggle } from "./ThemeToggle.jsx";

export function Header({ onAddAsset, onBulkUpload, onRefresh, refreshing }) {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true" />
        <h1>Asset Manager</h1>
        <span className="project-pill">
          Project: <strong>{ASSET_PROJECT}</strong>
        </span>
      </div>
      <div className="header-actions">
        <button type="button" className="btn btn-icon" onClick={onRefresh} title="Refresh" aria-label="Refresh">
          <RefreshIcon className={refreshing ? "spin" : ""} width={16} height={16} />
        </button>
        <button type="button" className="btn" onClick={onBulkUpload}>
          <StackIcon width={15} height={15} />
          Bulk Upload
        </button>
        <button type="button" className="btn btn-primary" onClick={onAddAsset}>
          <PlusIcon width={15} height={15} />
          Add Asset
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
