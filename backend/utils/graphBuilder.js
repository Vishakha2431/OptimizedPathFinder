/**
 * Build adjacency list + station map from MongoDB station documents.
 */
export function buildGraphFromStations(stations) {
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

  return { graph, stationMap };
}

/**
 * Sum distance and cost along a path of station ids.
 */
export function pathTotals(graph, pathIds) {
  let totalDistance = 0;
  let totalCost = 0;

  for (let i = 0; i < pathIds.length - 1; i++) {
    const from = pathIds[i];
    const to = pathIds[i + 1];
    const edge = (graph[from] || []).find((e) => e.stationId === to);
    if (edge) {
      totalDistance += Number(edge.distance || 0);
      totalCost += Number(edge.cost || 0);
    }
  }

  return { totalDistance, totalCost };
}
