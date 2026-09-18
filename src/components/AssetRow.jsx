import { formatBytes } from "../utils/format";
import { AssetThumbnail, TypeBadge } from "./AssetThumbnail.jsx";

function metaFor(asset) {
  if (asset.type === "spritesheet") {
    return `${asset.frameWidth}×${asset.frameHeight} frames`;
  }
  const size = formatBytes(asset.size);
  return size || asset.mimeType || "";
}

export function AssetRow({ asset, selected, active, onSelect, onToggle }) {
  return (
    <tr
      className={`asset-row ${selected ? "is-selected" : ""} ${active ? "is-active" : ""}`}
      onClick={() => onSelect(asset.assetKey)}
    >
      <td onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(asset.assetKey)}
          aria-label={`Select ${asset.assetKey}`}
        />
      </td>
      <td>
        <AssetThumbnail asset={asset} className="row-thumb" />
      </td>
      <td className="row-key-cell">{asset.assetKey}</td>
      <td>
        <TypeBadge type={asset.type} />
      </td>
      <td className="row-meta">{metaFor(asset)}</td>
    </tr>
  );
}
