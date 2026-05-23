/**
 * Interactive graph of locations and routes (React Flow).
 * Highlights the active route (Dijkstra or BFS).
 */
import React, { useMemo } from "react";
import ReactFlow, { MiniMap, Controls, Background } from "react-flow-renderer";
import "react-flow-renderer/dist/style.css";
import "react-flow-renderer/dist/theme-default.css";

const GraphView = ({ stations = [], highlightPath = [], algorithm }) => {
  const pathSet = useMemo(
    () => new Set((highlightPath || []).map(String)),
    [highlightPath]
  );

  const { nodes, edges } = useMemo(() => {
    const nodeList = (stations || []).map((station, index) => {
      const id = String(station._id);
      const onPath = pathSet.has(id);
      const pathColor = algorithm === "BFS" ? "#a78bfa" : "#34d399";
      return {
        id,
        data: { label: station.name },
        position: { x: 60 + (index % 4) * 180, y: 60 + Math.floor(index / 4) * 130 },
        style: {
          background: onPath ? "#1e3a5f" : "#1e293b",
          color: "#f1f5f9",
          border: onPath ? `2px solid ${pathColor}` : "1px solid #475569",
          borderRadius: 10,
          padding: "10px 14px",
          fontWeight: onPath ? 700 : 500,
          fontSize: 13,
        },
      };
    });

    const edgeList = [];
    const seen = new Set();

    (stations || []).forEach((station) => {
      const sourceId = String(station._id);
      (station.connections || []).forEach((conn) => {
        const targetId = String(conn.station?._id || conn.station || "");
        if (!targetId) return;

        const key = [sourceId, targetId].sort().join("-");
        if (seen.has(key)) return;
        seen.add(key);

        const pathIndexA = highlightPath.findIndex((p) => String(p) === sourceId);
        const pathIndexB = highlightPath.findIndex((p) => String(p) === targetId);
        const onPath =
          pathIndexA >= 0 &&
          pathIndexB >= 0 &&
          Math.abs(pathIndexA - pathIndexB) === 1;

        const edgeColor = algorithm === "BFS" ? "#a78bfa" : "#34d399";

        edgeList.push({
          id: key,
          source: sourceId,
          target: targetId,
          label: `${conn.distance} km · ₹${conn.cost}`,
          animated: onPath,
          style: {
            stroke: onPath ? edgeColor : "#64748b",
            strokeWidth: onPath ? 3 : 1.5,
          },
          labelStyle: { fill: "#94a3b8", fontSize: 11 },
        });
      });
    });

    return { nodes: nodeList, edges: edgeList };
  }, [stations, pathSet, highlightPath, algorithm]);

  if (!stations.length) {
    return (
      <p className="empty-hint">
        Add locations and connections to see the network graph.
      </p>
    );
  }

  return (
    <div className="graph-wrap">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background color="#334155" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(n) => (pathSet.has(n.id) ? "#34d399" : "#475569")}
          maskColor="rgba(15, 23, 42, 0.8)"
        />
      </ReactFlow>
    </div>
  );
};

export default GraphView;
