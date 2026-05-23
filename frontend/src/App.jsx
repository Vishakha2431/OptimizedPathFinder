/**
 * Indore Route Pathfinder — Dijkstra (shortest) + BFS (fewest stops), v0 style.
 */
import React, { useEffect, useState } from "react";
import GraphView from "./components/GraphView";
import {
  getStations,
  createStation,
  connectStations,
  getShortestPath,
  getBfsPath,
  updateStation,
  deleteStation,
} from "./api";

export default function App() {
  const [locations, setLocations] = useState([]);
  const [newLocationName, setNewLocationName] = useState("");
  const [firstLocation, setFirstLocation] = useState("");
  const [secondLocation, setSecondLocation] = useState("");
  const [distance, setDistance] = useState("");
  const [cost, setCost] = useState("");
  const [loading, setLoading] = useState(false);
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [optimizeBy, setOptimizeBy] = useState("distance");
  const [algorithm, setAlgorithm] = useState("dijkstra"); // dijkstra | bfs
  const [routeResult, setRouteResult] = useState(null);
  const [pathLoading, setPathLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [listVersion, setListVersion] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    fetchLocations();
  }, []);

  // Green message auto-hide after 3.5 seconds
  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => setSuccessMsg(""), 3500);
    return () => clearTimeout(timer);
  }, [successMsg]);

  /** Reload locations from backend (Refresh button) */
  async function fetchLocations({ showToast = false } = {}) {
    setRefreshing(true);
    try {
      setError("");
      const data = await getStations();
      const list = Array.isArray(data) ? data : [];
      setLocations(list);
      setListVersion((v) => v + 1);
      if (showToast) {
        setSuccessMsg(
          list.length
            ? `Refreshed — ${list.length} location${list.length === 1 ? "" : "s"} loaded.`
            : "Refreshed — no locations in database yet."
        );
      }
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.error;
      setError(
        detail ||
          "Could not load locations. Is backend running? (start-backend.bat → port 5000)"
      );
      if (showToast) setSuccessMsg("");
    } finally {
      setRefreshing(false);
    }
  }

  function handleRefresh() {
    fetchLocations({ showToast: true });
  }

  function startEdit(location) {
    setEditingId(location._id);
    setEditName(location.name);
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
  }

  async function handleUpdateLocation(e) {
    e.preventDefault();
    if (!editingId) return;
    const name = editName.trim();
    if (!name) {
      setError("Location name cannot be empty.");
      return;
    }
    setLoading(true);
    try {
      await updateStation(editingId, name);
      setSuccessMsg(`Updated to "${name}"`);
      cancelEdit();
      if (fromLocation === editingId || toLocation === editingId) {
        setRouteResult(null);
      }
      await fetchLocations();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update location.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteLocation(location) {
    const ok = window.confirm(
      `Delete "${location.name}"?\n\nAll its connections will also be removed from the database.`
    );
    if (!ok) return;

    setLoading(true);
    setError("");
    try {
      await deleteStation(location._id);
      setSuccessMsg(`Deleted "${location.name}"`);
      if (
        editingId === location._id ||
        fromLocation === location._id ||
        toLocation === location._id ||
        routeResult?.path?.some((p) => String(p) === String(location._id))
      ) {
        cancelEdit();
        setFromLocation("");
        setToLocation("");
        setRouteResult(null);
      }
      await fetchLocations();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete location.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateLocation(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    const name = newLocationName.trim();
    if (!name) {
      setError("Please enter a location name.");
      return;
    }
    setLoading(true);
    try {
      await createStation(name);
      setNewLocationName("");
      setSuccessMsg(`Added "${name}"`);
      await fetchLocations();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add location.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConnectLocations(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!firstLocation || !secondLocation || !distance || !cost) {
      setError("Fill all fields to connect two locations.");
      return;
    }
    if (firstLocation === secondLocation) {
      setError("Choose two different locations.");
      return;
    }
    setLoading(true);
    try {
      await connectStations({
        firstStation: firstLocation,
        secondStation: secondLocation,
        distance: Number(distance),
        cost: Number(cost),
      });
      setFirstLocation("");
      setSecondLocation("");
      setDistance("");
      setCost("");
      setSuccessMsg("Locations connected.");
      await fetchLocations();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to connect locations.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFindRoute(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!fromLocation || !toLocation) {
      setError("Select both source and destination.");
      return;
    }

    setPathLoading(true);
    setRouteResult(null);

    try {
      const res =
        algorithm === "bfs"
          ? await getBfsPath(fromLocation, toLocation)
          : await getShortestPath(fromLocation, toLocation, optimizeBy);

      if (!res.success) {
        throw new Error(res.error || "No path found");
      }

      setRouteResult({
        ...res,
        readablePath: res.pathDetails.map((loc) => loc.name),
      });
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Failed to find route."
      );
    } finally {
      setPathLoading(false);
    }
  }

  const formatNumber = (n) =>
    Number.isFinite(Number(n)) ? Number(n).toFixed(2) : "—";

  const isDijkstra = algorithm === "dijkstra";

  return (
    <div className="app">
      <header className="app-header">
        <h1>Indore Route Pathfinder</h1>
        <p>Shortest path (Dijkstra) · Fewest stops (BFS)</p>
        <div className="badge-row">
          <span className="badge badge-dijkstra">Dijkstra</span>
          <span className="badge badge-bfs">BFS</span>
          <span className="badge badge-count">
            {locations.length} location{locations.length !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      {error && (
        <div className="message message-error" role="alert">
          {error}
          <button
            type="button"
            className="message-dismiss"
            onClick={() => setError("")}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {successMsg && (
        <div className="message message-success toast" role="status">
          {successMsg}
          <button
            type="button"
            className="message-dismiss"
            onClick={() => setSuccessMsg("")}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <main className="main-grid">
        <div className="panel">
          <section className="card card-route">
            <div className="card-head">
              <h2>Find route</h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleRefresh}
                disabled={refreshing}
                title="Reload locations from database"
              >
                {refreshing ? (
                  <span className="btn-loading">
                    <span className="spinner spinner-light" /> Loading…
                  </span>
                ) : (
                  "↻ Refresh"
                )}
              </button>
            </div>

            <div className="algo-picker" role="group" aria-label="Algorithm">
              <button
                type="button"
                className={`algo-pill ${isDijkstra ? "active" : ""}`}
                onClick={() => setAlgorithm("dijkstra")}
              >
                Dijkstra
                <small>Shortest distance / cost</small>
              </button>
              <button
                type="button"
                className={`algo-pill ${!isDijkstra ? "active" : ""}`}
                onClick={() => setAlgorithm("bfs")}
              >
                BFS
                <small>Fewest stops</small>
              </button>
            </div>

            <form onSubmit={handleFindRoute}>
              <div className="form-row">
                <div className="field" style={{ flex: 1, minWidth: 140 }}>
                  <label className="field-label" htmlFor="from">
                    From
                  </label>
                  <select
                    id="from"
                    value={fromLocation}
                    onChange={(e) => setFromLocation(e.target.value)}
                  >
                    <option value="">Select location</option>
                    {locations.map((loc) => (
                      <option key={loc._id} value={loc._id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ flex: 1, minWidth: 140 }}>
                  <label className="field-label" htmlFor="to">
                    To
                  </label>
                  <select
                    id="to"
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                  >
                    <option value="">Select location</option>
                    {locations.map((loc) => (
                      <option key={loc._id} value={loc._id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isDijkstra && (
                <div className="form-row">
                  <div className="field" style={{ flex: 1 }}>
                    <label className="field-label" htmlFor="metric">
                      Optimize by
                    </label>
                    <select
                      id="metric"
                      value={optimizeBy}
                      onChange={(e) => setOptimizeBy(e.target.value)}
                    >
                      <option value="distance">Shortest distance (km)</option>
                      <option value="cost">Lowest cost (₹)</option>
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={pathLoading || locations.length < 2}
              >
                {pathLoading ? (
                  <span className="btn-loading">
                    <span className="spinner" /> Searching…
                  </span>
                ) : isDijkstra ? (
                  "Find shortest route (Dijkstra)"
                ) : (
                  "Find route — fewest stops (BFS)"
                )}
              </button>
            </form>

            {routeResult && (
              <div
                className={`message message-success result-box ${
                  routeResult.algorithm === "BFS" ? "result-bfs" : "result-dijkstra"
                }`}
              >
                <p className="result-algo">
                  {routeResult.algorithm === "BFS" ? "BFS" : "Dijkstra"} result
                </p>
                <p className="path-chain">
                  {routeResult.readablePath.join(" → ")}
                </p>
                <div className="path-stats">
                  <div className="stat-box">
                    <strong>{formatNumber(routeResult.totalDistance)}</strong>
                    <span>km</span>
                  </div>
                  <div className="stat-box">
                    <strong>₹{formatNumber(routeResult.totalCost)}</strong>
                    <span>cost</span>
                  </div>
                  <div className="stat-box">
                    <strong>{routeResult.steps}</strong>
                    <span>stops</span>
                  </div>
                </div>
                {isDijkstra && (
                  <p className="result-note">
                    Optimized for{" "}
                    {routeResult.metric === "cost"
                      ? "lowest cost"
                      : "shortest distance"}
                  </p>
                )}
                {!isDijkstra && (
                  <p className="result-note">
                    BFS picks the path with the fewest hops (not always shortest km).
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="card">
            <h2>Add location</h2>
            <form onSubmit={handleCreateLocation} className="form-row">
              <input
                type="text"
                placeholder="e.g. Rajwada, Vijay Nagar"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                disabled={loading}
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                Add
              </button>
            </form>
          </section>

          <section className="card">
            <h2>Connect locations</h2>
            <form onSubmit={handleConnectLocations} className="form-grid">
              <div>
                <label className="field-label">First location</label>
                <select
                  value={firstLocation}
                  onChange={(e) => setFirstLocation(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select</option>
                  {locations.map((loc) => (
                    <option key={loc._id} value={loc._id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Second location</label>
                <select
                  value={secondLocation}
                  onChange={(e) => setSecondLocation(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select</option>
                  {locations.map((loc) => (
                    <option key={loc._id} value={loc._id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder="Distance (km)"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                disabled={loading}
              />
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Cost (₹)"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
              >
                Connect
              </button>
            </form>
          </section>

          <section className="card">
            <h2>All locations</h2>
            {locations.length === 0 ? (
              <p className="empty-hint">No locations yet. Add some above.</p>
            ) : (
              <ul className="location-list">
                {locations.map((location) => (
                  <li key={location._id} className="location-item">
                    <div className="location-row">
                      {editingId === location._id ? (
                        <form
                          className="location-edit-form"
                          onSubmit={handleUpdateLocation}
                        >
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            disabled={loading}
                            autoFocus
                          />
                          <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={loading}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={cancelEdit}
                            disabled={loading}
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <>
                          <span className="location-name">{location.name}</span>
                          <div className="location-actions">
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => startEdit(location)}
                              disabled={loading}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteLocation(location)}
                              disabled={loading}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    {location.connections?.length > 0 ? (
                      <ul className="connection-list">
                        {location.connections.map((conn, idx) => (
                          <li key={idx}>
                            → {conn.station?.name || "Unknown"} —{" "}
                            {conn.distance} km, ₹{conn.cost}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="empty-hint" style={{ margin: "6px 0 0" }}>
                        No connections
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="card graph-card sticky-graph">
          <h2>Network map</h2>
          <GraphView
            key={listVersion}
            stations={locations}
            highlightPath={routeResult?.path || []}
            algorithm={routeResult?.algorithm}
          />
        </section>
      </main>

      <footer className="app-footer">
        <strong>Dijkstra</strong> — minimum total distance or cost &nbsp;|&nbsp;
        <strong>BFS</strong> — minimum number of stops (level-order search)
      </footer>
    </div>
  );
}
