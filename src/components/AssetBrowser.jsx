import { ASSET_SERVER_URL } from "../config";
import { AssetCard } from "./AssetCard.jsx";
import { AssetRow } from "./AssetRow.jsx";
import { StatePanel } from "./StatePanel.jsx";

export function AssetBrowser({
  status,
  error,
  assets,
  totalCount,
  viewMode,
  selectedKeys,
  activeKey,
  onSelectAsset,
  onToggleSelect,
  onRetry,
}) {
  if (status === "loading") {
    return (
      <div className="asset-scroll">
        <StatePanel title="Loading assets…" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="asset-scroll">
        <StatePanel icon="alert" title="Asset Server unavailable">
          <p>
            Unable to load assets from <code>{ASSET_SERVER_URL}</code>.
          </p>
          {error?.message && <p>{error.message}</p>}
          <button type="button" className="btn" onClick={onRetry} style={{ marginTop: 8 }}>
            Try again
          </button>
        </StatePanel>
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="asset-scroll">
        <StatePanel title="No assets yet">
          <p>This project doesn&apos;t have any assets. Use Add Asset to upload one.</p>
        </StatePanel>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="asset-scroll">
        <StatePanel title="No matching assets">
          <p>Try a different search term or type filter.</p>
        </StatePanel>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="asset-scroll">
        <table className="asset-table">
          <thead>
            <tr>
              <th style={{ width: 32 }} />
              <th style={{ width: 52 }} />
              <th>Asset key</th>
              <th>Type</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <AssetRow
                key={asset.assetKey}
                asset={asset}
                selected={selectedKeys.has(asset.assetKey)}
                active={asset.assetKey === activeKey}
                onSelect={onSelectAsset}
                onToggle={onToggleSelect}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="asset-scroll">
      <div className="asset-grid">
        {assets.map((asset) => (
          <AssetCard
            key={asset.assetKey}
            asset={asset}
            selected={selectedKeys.has(asset.assetKey)}
            active={asset.assetKey === activeKey}
            onSelect={onSelectAsset}
            onToggle={onToggleSelect}
          />
        ))}
      </div>
    </div>
  );
}
