/**
 * BFS & Dijkstra — same as v0 / backend logic (for demos & fallback).
 */

/**
 * BFS — first path found (fewest hops in unweighted graph).
 */
export function bfs(graph, start, goal) {
  if (start === goal) return [start];

  const visited = new Set([start]);
  const queue = [[start]];

  while (queue.length > 0) {
    const path = queue.shift();
    const node = path[path.length - 1];

    for (const neighbor of graph[node] || []) {
      const next = neighbor.to ?? neighbor.stationId;
      if (visited.has(next)) continue;

      const nextPath = [...path, next];
      if (next === goal) return nextPath;

      visited.add(next);
      queue.push(nextPath);
    }
  }

  return null;
}

/**
 * Dijkstra — shortest path by distance or cost (non-negative weights).
 */
export function dijkstra(graph, start, goal, metric = "distance") {
  const dist = {};
  const cost = {};
  const prev = {};
  const visited = new Set();

  Object.keys(graph).forEach((id) => {
    dist[id] = Infinity;
    cost[id] = Infinity;
    prev[id] = null;
  });

  dist[start] = 0;
  cost[start] = 0;

  const pq = [{ id: start, priority: 0 }];

  while (pq.length > 0) {
    pq.sort((a, b) => a.priority - b.priority);
    const { id: current } = pq.shift();

    if (visited.has(current)) continue;
    visited.add(current);
    if (current === goal) break;

    for (const edge of graph[current] || []) {
      const next = edge.to ?? edge.stationId;
      const edgeDist = Number(edge.distance || 0);
      const edgeCost = Number(edge.cost || 0);
      const newDist = dist[current] + edgeDist;
      const newCost = cost[current] + edgeCost;
      const newWeight = metric === "cost" ? newCost : newDist;
      const oldWeight = metric === "cost" ? cost[next] : dist[next];

      if (newWeight < oldWeight) {
        dist[next] = newDist;
        cost[next] = newCost;
        prev[next] = current;
        pq.push({ id: next, priority: newWeight });
      }
    }
  }

  if (dist[goal] === Infinity && cost[goal] === Infinity) {
    return { path: null, totalDistance: 0, totalCost: 0 };
  }

  const path = [];
  let node = goal;
  while (node) {
    path.unshift(node);
    node = prev[node];
  }

  return {
    path: path[0] === start ? path : null,
    totalDistance: dist[goal],
    totalCost: cost[goal],
  };
}
