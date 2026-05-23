import express from "express";
import Station from "../models/Station.js";

const router = express.Router();

/** Min-heap for Dijkstra — always extracts the node with lowest priority (weight) */
class MinHeap {
  constructor() {
    this.items = [];
  }
  push(node) {
    this.items.push(node);
    this.#bubbleUp(this.items.length - 1);
  }
  pop() {
    if (this.items.length === 0) return null;
    const top = this.items[0];
    const last = this.items.pop();
    if (this.items.length > 0 && last) {
      this.items[0] = last;
      this.#bubbleDown(0);
    }
    return top;
  }
  get size() {
    return this.items.length;
  }
  #bubbleUp(i) {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this.items[p].priority <= this.items[i].priority) break;
      [this.items[p], this.items[i]] = [this.items[i], this.items[p]];
      i = p;
    }
  }
  #bubbleDown(i) {
    const n = this.items.length;
    while (true) {
      let smallest = i;
      const l = i * 2 + 1;
      const r = i * 2 + 2;
      if (l < n && this.items[l].priority < this.items[smallest].priority)
        smallest = l;
      if (r < n && this.items[r].priority < this.items[smallest].priority)
        smallest = r;
      if (smallest === i) break;
      [this.items[smallest], this.items[i]] = [this.items[i], this.items[smallest]];
      i = smallest;
    }
  }
}

/**
 * GET /api/shortest-path
 * Shortest route using Dijkstra's algorithm (min-heap priority queue).
 *
 * Query: from, to, metric (distance | cost)
 */
router.get("/", async (req, res) => {
  const { from, to, metric = "distance" } = req.query;
  const normalizedMetric = metric === "cost" ? "cost" : "distance";

  if (!from || !to) {
    return res.status(400).json({
      success: false,
      error: "Both from and to station IDs are required",
      example: "/api/shortest-path?from=station1&to=station2",
    });
  }

  try {
    const stations = await Station.find({}).populate(
      "connections.station",
      "_id name coordinates"
    );

    if (!stations.length) {
      return res.status(404).json({
        success: false,
        error: "No stations found in database",
      });
    }

    const graph = {};
    const stationMap = {};

    stations.forEach((station) => {
      const stationId = station._id.toString();
      stationMap[stationId] = station;

      graph[stationId] = (station.connections || []).map((conn) => ({
        stationId: conn.station._id.toString(),
        distance: conn.distance,
        cost: conn.cost,
      }));
    });

    if (!stationMap[from] || !stationMap[to]) {
      return res.status(404).json({
        success: false,
        error: "One or both station IDs not found",
        availableStations: stations.slice(0, 10).map((s) => ({
          id: s._id,
          name: s.name,
        })),
      });
    }

    if (from === to) {
      const station = stationMap[from];
      return res.json({
        success: true,
        algorithm: "Dijkstra",
        path: [from],
        pathDetails: [
          {
            id: station._id,
            name: station.name,
            coordinates: station.coordinates,
          },
        ],
        metric: normalizedMetric,
        totalDistance: 0,
        totalCost: 0,
        steps: 0,
        optimizedValue: 0,
      });
    }

    // Dijkstra's algorithm — greedy shortest path with non-negative edge weights
    const weight = {};
    const totalDistance = {};
    const totalCost = {};
    const previous = {};
    const settled = new Set();

    Object.keys(graph).forEach((id) => {
      weight[id] = Infinity;
      totalDistance[id] = Infinity;
      totalCost[id] = Infinity;
      previous[id] = null;
    });

    weight[from] = 0;
    totalDistance[from] = 0;
    totalCost[from] = 0;

    const heap = new MinHeap();
    heap.push({ id: from, priority: 0 });

    while (heap.size > 0) {
      const currentNode = heap.pop();
      if (!currentNode) break;
      const current = currentNode.id;
      if (settled.has(current)) continue;
      settled.add(current);
      if (current === to) break;

      for (const edge of graph[current] || []) {
        const next = edge.stationId;
        if (settled.has(next)) continue;

        const nextDistance =
          totalDistance[current] + Number(edge.distance || 0);
        const nextCost = totalCost[current] + Number(edge.cost || 0);
        const nextWeight =
          normalizedMetric === "cost" ? nextCost : nextDistance;

        const isBetter =
          nextWeight < weight[next] ||
          (nextWeight === weight[next] &&
            ((normalizedMetric === "cost" && nextDistance < totalDistance[next]) ||
              (normalizedMetric === "distance" && nextCost < totalCost[next])));

        if (isBetter) {
          weight[next] = nextWeight;
          totalDistance[next] = nextDistance;
          totalCost[next] = nextCost;
          previous[next] = current;
          heap.push({ id: next, priority: nextWeight });
        }
      }
    }

    const pathIds = [];
    let current = to.toString();

    while (current !== null) {
      pathIds.unshift(current);
      current = previous[current];
    }

    if (weight[to] === Infinity) {
      return res.status(404).json({
        success: false,
        error: "No path exists between these stations",
        algorithm: "Dijkstra",
        possibleReasons: [
          "Stations are in disconnected networks",
          "All connections are one-way in the wrong direction",
        ],
      });
    }

    const pathDetails = pathIds.map((id) => {
      const station = stationMap[id];
      return {
        id: station._id,
        name: station.name,
        coordinates: station.coordinates,
      };
    });

    res.json({
      success: true,
      algorithm: "Dijkstra",
      path: pathIds,
      pathDetails,
      metric: normalizedMetric,
      totalDistance: totalDistance[to],
      totalCost: totalCost[to],
      steps: pathIds.length - 1,
      optimizedValue: weight[to],
    });
  } catch (error) {
    console.error("[ShortestPath] Error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;
