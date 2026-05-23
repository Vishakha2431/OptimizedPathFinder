/**
 * Build adjacency list from API station list (for client-side BFS).
 */
export function buildGraphFromStations(stations) {
  const graph = {};

  (stations || []).forEach((station) => {
    const id = String(station._id);
    graph[id] = (station.connections || []).map((conn) => ({
      to: String(conn.station?._id || conn.station),
      distance: conn.distance,
      cost: conn.cost,
    }));
  });

  return graph;
}

export function pathTotals(graph, pathIds) {
  let totalDistance = 0;
  let totalCost = 0;

  for (let i = 0; i < pathIds.length - 1; i++) {
    const from = pathIds[i];
    const to = pathIds[i + 1];
    const edge = (graph[from] || []).find((e) => e.to === to);
    if (edge) {
      totalDistance += Number(edge.distance || 0);
      totalCost += Number(edge.cost || 0);
    }
  }

  return { totalDistance, totalCost };
}
