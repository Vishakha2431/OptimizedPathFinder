import express from "express";
import Station from "../models/Station.js";
import { buildGraphFromStations, pathTotals } from "../utils/graphBuilder.js";
import { findPathWithBFS } from "../utils/bfsPathfinder.js";

const router = express.Router();

/**
 * GET /api/bfs-path
 * Route with fewest stops using BFS (Breadth-First Search).
 */
router.get("/", async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({
      success: false,
      error: "Both from and to station IDs are required",
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

    const { graph, stationMap } = buildGraphFromStations(stations);

    if (!stationMap[from] || !stationMap[to]) {
      return res.status(404).json({
        success: false,
        error: "One or both station IDs not found",
      });
    }

    const pathIds = findPathWithBFS(graph, from, to);

    if (!pathIds) {
      return res.status(404).json({
        success: false,
        error: "No path exists between these stations",
        algorithm: "BFS",
      });
    }

    const { totalDistance, totalCost } = pathTotals(graph, pathIds);

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
      algorithm: "BFS",
      path: pathIds,
      pathDetails,
      totalDistance,
      totalCost,
      steps: pathIds.length - 1,
    });
  } catch (error) {
    console.error("[BfsPath] Error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

export default router;
