import { GridIcon, ListIcon } from "./icons.jsx";

const TYPE_FILTERS = [
  { value: "all", label: "All" },
  { value: "image", label: "Images" },
  { value: "spritesheet", label: "Spritesheets" },
  { value: "audio", label: "Audio" },
];

export function Toolbar({ search, onSearchChange, typeFilter, onTypeFilterChange, viewMode, onViewModeChange }) {
  return (
    <div className="toolbar">
      <input
        type="text"
        className="search-input"
        placeholder="Search by asset key or filename…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Search assets"
      />
      <select
        className="select-input"
        value={typeFilter}
        onChange={(e) => onTypeFilterChange(e.target.value)}
        aria-label="Filter by type"
      >
        {TYPE_FILTERS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="view-toggle" role="group" aria-label="View mode">
        <button
          type="button"
          className={viewMode === "card" ? "active" : ""}
          onClick={() => onViewModeChange("card")}
          title="Card view"
          aria-pressed={viewMode === "card"}
        >
          <GridIcon width={15} height={15} />
        </button>
        <button
          type="button"
          className={viewMode === "list" ? "active" : ""}
          onClick={() => onViewModeChange("list")}
          title="List view"
          aria-pressed={viewMode === "list"}
        >
          <ListIcon width={15} height={15} />
        </button>
      </div>
    </div>
  );
}
