/**
 * BFS — finds the first / fewest-hop path from source to destination (unweighted).
 */
export function findPathWithBFS(graph, from, to) {
  if (from === to) return [from];

  const visited = new Set([from]);
  const queue = [[from]];

  while (queue.length > 0) {
    const path = queue.shift();
    const node = path[path.length - 1];

    for (const edge of graph[node] || []) {
      const next = edge.stationId;
      if (visited.has(next)) continue;

      const nextPath = [...path, next];
      if (next === to) return nextPath;

      visited.add(next);
      queue.push(nextPath);
    }
  }

  return null;
}
