import { resolveAssetUrl } from "../api/assetServer";
import { AudioIcon, TypeIcon } from "./icons.jsx";

export function AssetThumbnail({ asset, className = "" }) {
  if (asset.type === "audio") {
    return (
      <div className={className}>
        <div className="thumb-icon">
          <AudioIcon />
        </div>
      </div>
    );
  }

  const src = resolveAssetUrl(asset.location);

  return (
    <div className={className}>
      <img src={src} alt={asset.assetKey} loading="lazy" draggable={false} />
    </div>
  );
}

export function TypeBadge({ type }) {
  return (
    <span className="type-badge">
      <span className={`type-dot ${type}`} />
      {type}
    </span>
  );
}

export function TypeSelectIcon({ type, ...props }) {
  return <TypeIcon type={type} {...props} />;
}
