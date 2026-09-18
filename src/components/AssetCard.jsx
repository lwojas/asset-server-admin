import { AssetThumbnail, TypeBadge } from "./AssetThumbnail.jsx";

export function AssetCard({ asset, selected, active, onSelect, onToggle }) {
  return (
    <button
      type="button"
      className={`asset-card ${selected ? "is-selected" : ""} ${active ? "is-active" : ""}`}
      onClick={() => onSelect(asset.assetKey)}
    >
      <input
        type="checkbox"
        className="asset-checkbox"
        checked={selected}
        onClick={(e) => e.stopPropagation()}
        onChange={() => onToggle(asset.assetKey)}
        aria-label={`Select ${asset.assetKey}`}
      />
      <AssetThumbnail asset={asset} className="thumb-wrap" />
      <div className="card-body">
        <div className="card-key" title={asset.assetKey}>
          {asset.assetKey}
        </div>
        <div className="card-meta">
          <TypeBadge type={asset.type} />
        </div>
      </div>
    </button>
  );
}
