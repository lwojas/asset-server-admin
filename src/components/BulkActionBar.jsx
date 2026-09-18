export function BulkActionBar({ count, onClear, onDelete }) {
  return (
    <div className="bulk-bar">
      <span>
        <strong>{count}</strong> asset{count === 1 ? "" : "s"} selected
      </span>
      <div className="actions">
        <button type="button" className="btn btn-sm" onClick={onClear}>
          Clear selection
        </button>
        <button type="button" className="btn btn-sm btn-danger" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}
