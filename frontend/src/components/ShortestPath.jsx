// ShortestPath.jsx
import React, { useState, useEffect } from "react";
import { getStations, getShortestPath } from "../api";

export default function ShortestPath() {
  const [stations, setStations] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pathResult, setPathResult] = useState(null);

  useEffect(() => {
    getStations().then(setStations);
  }, []);

  const findShortestPath = async () => {
    if (!from || !to) return alert("Select both stations");
    const data = await getShortestPath(from, to, "distance");
    setPathResult(data);
  };

  return (
    <div style={{ marginTop: 40, padding: 20, backgroundColor: "#F3E5F5", borderRadius: 12 }}>
      <h2 style={{ color: "#8E24AA" }}>📏 Shortest Path</h2>
      <div style={{ marginBottom: 10 }}>
        <label>From: </label>
        <select value={from} onChange={(e) => setFrom(e.target.value)}>
          <option value="">-- Select --</option>
          {stations.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label>To: </label>
        <select value={to} onChange={(e) => setTo(e.target.value)}>
          <option value="">-- Select --</option>
          {stations.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
      </div>
      <button
        onClick={findShortestPath}
        style={{ padding: "10px 16px", backgroundColor: "#AB47BC", color: "#fff", border: "none", borderRadius: 6 }}
      >
        Find Shortest Path
      </button>

      {pathResult && (
        <div style={{ marginTop: 20 }}>
          <h3>Shortest Distance: {pathResult.totalDistance} km</h3>
          <p>
            Path:{" "}
            {pathResult.pathDetails?.map((p, idx) => (
              <span key={p.id}>
                {p.name}
                {idx < pathResult.pathDetails.length - 1 ? " → " : ""}
              </span>
            )) || null}
          </p>
        </div>
      )}
    </div>
  );
}
