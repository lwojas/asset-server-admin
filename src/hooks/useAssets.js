import { useCallback, useEffect, useState } from "react";
import * as assetServer from "../api/assetServer";
import { ASSET_PROJECT } from "../config";

// Owns the client-side copy of the project asset manifest. The server
// remains the source of truth; this hook re-syncs after every mutation
// rather than maintaining independent derived state.
export function useAssets() {
  const [assets, setAssets] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setStatus((current) => (current === "ready" ? "refreshing" : "loading"));
    setError(null);
    try {
      const manifest = await assetServer.getAllAssets(ASSET_PROJECT);
      setAssets(manifest.assets || []);
      setStatus("ready");
    } catch (err) {
      setError(err);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const upsertLocal = useCallback((asset) => {
    setAssets((current) => {
      const index = current.findIndex((a) => a.assetKey === asset.assetKey);
      if (index === -1) return [...current, asset];
      const next = current.slice();
      next[index] = asset;
      return next;
    });
  }, []);

  const removeLocal = useCallback((assetKey) => {
    setAssets((current) => current.filter((a) => a.assetKey !== assetKey));
  }, []);

  return { assets, status, error, refresh, upsertLocal, removeLocal };
}
