/**
 * API client for Indore Route Pathfinder backend.
 * Local dev: Vite proxies /api → http://localhost:5000
 */
import axios from "axios";

const BASE_URL =
  "https://optimizedpathfinder.onrender.com/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

/** Fetch all locations (stations) with connections */
export async function getStations() {
  const res = await api.get("/stations");
  return res.data;
}

/** Add a new location by name */
export async function createStation(name) {
  const res = await api.post("/stations", { name });
  return res.data;
}

/** Update location name */
export async function updateStation(id, name) {
  const res = await api.put(`/stations/${id}`, { name });
  return res.data;
}

/** Delete location (and its connections in DB) */
export async function deleteStation(id) {
  const res = await api.delete(`/stations/${id}`);
  return res.data;
}

/** Connect two locations with distance (km) and cost (₹) */
export async function connectStations({
  firstStation,
  secondStation,
  distance,
  cost,
}) {
  const res = await api.post("/stations/connect", {
    firstStation,
    secondStation,
    distance,
    cost,
  });
  return res.data;
}

/** Shortest route — Dijkstra (backend) */
export async function getShortestPath(from, to, metric = "distance") {
  const res = await api.get("/shortest-path", {
    params: { from, to, metric },
  });
  return res.data;
}

/** Fewest-stop route — BFS (backend) */
export async function getBfsPath(from, to) {
  const res = await api.get("/bfs-path", {
    params: { from, to },
  });
  return res.data;
}

export default api;
