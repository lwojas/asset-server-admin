import { useCallback, useMemo, useState } from "react";
import * as assetServer from "./api/assetServer";
import { ASSET_PROJECT } from "./config";
import { AssetBrowser } from "./components/AssetBrowser.jsx";
import { AssetDetail } from "./components/AssetDetail.jsx";
import { BulkActionBar } from "./components/BulkActionBar.jsx";
import { BulkUploadDialog } from "./components/BulkUploadDialog.jsx";
import { ConfirmDialog } from "./components/ConfirmDialog.jsx";
import { Header } from "./components/Header.jsx";
import { Toolbar } from "./components/Toolbar.jsx";
import { ToastViewport } from "./components/ToastViewport.jsx";
import { UploadDialog } from "./components/UploadDialog.jsx";
import { useAssets } from "./hooks/useAssets";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { ToastProvider, useToast } from "./hooks/useToast.jsx";

function AppShell() {
  const { assets, status, error, refresh, upsertLocal, removeLocal } = useAssets();
  const { notify } = useToast();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useLocalStorage("asset-admin-view-mode", "card");

  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const [activeAssetKey, setActiveAssetKey] = useState(null);
  const [hasUnresolvedSave, setHasUnresolvedSave] = useState(false);

  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false);

  const filteredAssets = useMemo(() => {
    const term = search.trim().toLowerCase();
    return assets.filter((asset) => {
      if (typeFilter !== "all" && asset.type !== typeFilter) return false;
      if (!term) return true;
      return (
        asset.assetKey.toLowerCase().includes(term) ||
        (asset.originalFilename || "").toLowerCase().includes(term)
      );
    });
  }, [assets, search, typeFilter]);

  const activeAsset = activeAssetKey ? assets.find((a) => a.assetKey === activeAssetKey) : null;

  function confirmLeaveActiveAsset(nextKey) {
    if (!hasUnresolvedSave || nextKey === activeAssetKey) return true;
    return window.confirm(
      "This asset's replacement upload hasn't finished. Leaving now means you'll need to re-add it manually if you don't come back to retry. Leave anyway?",
    );
  }

  function handleSelectAsset(key) {
    if (!confirmLeaveActiveAsset(key)) return;
    setHasUnresolvedSave(false);
    setActiveAssetKey(key);
  }

  function handleCloseDetail() {
    if (!confirmLeaveActiveAsset(null)) return;
    setHasUnresolvedSave(false);
    setActiveAssetKey(null);
  }

  function toggleSelect(key) {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedKeys(new Set(filteredAssets.map((a) => a.assetKey)));
  }

  function clearSelection() {
    setSelectedKeys(new Set());
  }

  const allVisibleSelected =
    filteredAssets.length > 0 && filteredAssets.every((a) => selectedKeys.has(a.assetKey));

  async function handleBulkDelete() {
    const keys = Array.from(selectedKeys);
    const failures = [];
    for (const key of keys) {
      try {
        await assetServer.removeAsset(ASSET_PROJECT, key);
        removeLocal(key);
        if (activeAssetKey === key) setActiveAssetKey(null);
      } catch {
        failures.push(key);
      }
    }
    setConfirmingBulkDelete(false);
    const succeeded = keys.length - failures.length;
    if (failures.length === 0) {
      notify(`✓ ${succeeded} asset${succeeded === 1 ? "" : "s"} deleted`);
      setSelectedKeys(new Set());
    } else {
      notify(
        `Deleted ${succeeded}, failed to delete: ${failures.join(", ")}`,
        { tone: "error", duration: 7000 },
      );
      setSelectedKeys(new Set(failures));
    }
  }

  const handleUploaded = useCallback(
    (asset) => {
      upsertLocal(asset);
    },
    [upsertLocal],
  );

  function handleAssetDeleted(key) {
    removeLocal(key);
    setSelectedKeys((current) => {
      if (!current.has(key)) return current;
      const next = new Set(current);
      next.delete(key);
      return next;
    });
    if (activeAssetKey === key) setActiveAssetKey(null);
  }

  function handleAssetSaved(oldKey, updatedAsset) {
    if (oldKey !== updatedAsset.assetKey) removeLocal(oldKey);
    upsertLocal(updatedAsset);
    setActiveAssetKey(updatedAsset.assetKey);
    setHasUnresolvedSave(false);
  }

  return (
    <div className="app">
      <Header
        onAddAsset={() => setShowAddAsset(true)}
        onBulkUpload={() => setShowBulkUpload(true)}
        onRefresh={refresh}
        refreshing={status === "refreshing"}
      />

      <div className="app-main">
        <section className="list-pane">
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {selectedKeys.size > 0 ? (
            <BulkActionBar
              count={selectedKeys.size}
              onClear={clearSelection}
              onDelete={() => setConfirmingBulkDelete(true)}
            />
          ) : (
            status === "ready" &&
            filteredAssets.length > 0 && (
              <div className="list-meta-row">
                <label className="select-all">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={() => (allVisibleSelected ? clearSelection() : selectAllVisible())}
                  />
                  Select all visible
                </label>
                <span>
                  {filteredAssets.length} of {assets.length} asset{assets.length === 1 ? "" : "s"}
                </span>
              </div>
            )
          )}

          <AssetBrowser
            status={status}
            error={error}
            assets={filteredAssets}
            totalCount={assets.length}
            viewMode={viewMode}
            selectedKeys={selectedKeys}
            activeKey={activeAssetKey}
            onSelectAsset={handleSelectAsset}
            onToggleSelect={toggleSelect}
            onRetry={refresh}
          />
        </section>

        <section className={`detail-pane ${activeAssetKey ? "is-open" : ""}`}>
          {activeAsset ? (
            <AssetDetail
              key={activeAsset.assetKey}
              asset={activeAsset}
              onBack={handleCloseDetail}
              onDeleted={handleAssetDeleted}
              onSaved={handleAssetSaved}
              onPendingRetryChange={setHasUnresolvedSave}
            />
          ) : (
            <div className="detail-empty">
              <p>Select an asset to view its details.</p>
            </div>
          )}
        </section>
      </div>

      {showAddAsset && (
        <UploadDialog onClose={() => setShowAddAsset(false)} onUploaded={handleUploaded} />
      )}

      {showBulkUpload && (
        <BulkUploadDialog onClose={() => setShowBulkUpload(false)} onUploaded={handleUploaded} />
      )}

      {confirmingBulkDelete && (
        <ConfirmDialog
          title="Delete selected assets"
          message={`Delete ${selectedKeys.size} selected asset${
            selectedKeys.size === 1 ? "" : "s"
          }? This removes each registry entry and its stored file. This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleBulkDelete}
          onCancel={() => setConfirmingBulkDelete(false)}
        />
      )}

      <ToastViewport />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppShell />
    </ToastProvider>
  );
}
