export function formatBytes(bytes) {
  if (bytes == null || Number.isNaN(bytes)) return null;
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`;
}

// Derives a sensible, editable asset key from a filename.
// "cobra0.png" -> "cobra0", "item shotgun.png" -> "item_shotgun"
export function keyFromFilename(filename) {
  const withoutExtension = filename.replace(/\.[^./]+$/, "");
  return withoutExtension
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_-]/g, "");
}

// Joins an optional shared folder with a filename into a server `path`.
export function joinPath(folder, filename) {
  const cleanFolder = (folder || "").trim().replace(/^\/+|\/+$/g, "");
  return cleanFolder ? `${cleanFolder}/${filename}` : filename;
}

// Recovers the relative `path` originally used to upload an asset from the
// `location` the server returned for it.
export function pathFromLocation(location, projectId) {
  if (!location) return "";
  const prefix = `/projects/${projectId}/assets/`;
  return location.startsWith(prefix) ? location.slice(prefix.length) : location.replace(/^\/+/, "");
}

export function filenameFromPath(path) {
  if (!path) return "";
  const segments = path.split("/");
  return segments[segments.length - 1];
}
