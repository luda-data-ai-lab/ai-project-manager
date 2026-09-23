import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { Card, EmptyState, PageHeader, Spinner } from '../components/common';

const relationLabels = {
  depends_on: '의존',
  shares_module: '공통 모듈',
  uses_api: 'API 사용',
  precedes: '선행',
};
const relationColors = {
  depends_on: '#64748b',
  shares_module: '#6366f1',
  uses_api: '#10b981',
  precedes: '#f59e0b',
};
const statusColors = {
  planning: '#94a3b8',
  development: '#3b82f6',
  testing: '#8b5cf6',
  deployed: '#10b981',
  completed: '#22c55e',
  paused: '#f59e0b',
};

const NODE_W = 150;
const NODE_H = 52;
const GAP = 70;
const CANVAS_W = 900;

function connectedComponents(nodes, edges) {
  const adjacency = new Map(nodes.map((node) => [node.id, new Set()]));
  for (const edge of edges) {
    adjacency.get(edge.source_id)?.add(edge.target_id);
    adjacency.get(edge.target_id)?.add(edge.source_id);
  }
  const seen = new Set();
  const components = [];
  for (const node of nodes) {
    if (seen.has(node.id)) continue;
    const component = [];
    const stack = [node.id];
    while (stack.length) {
      const id = stack.pop();
      if (seen.has(id)) continue;
      seen.add(id);
      component.push(id);
      for (const next of adjacency.get(id) || []) if (!seen.has(next)) stack.push(next);
    }
    components.push(component);
  }
  return components.sort((a, b) => b.length - a.length);
}

function layout(nodes, edges) {
  const positions = new Map();
  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;
  for (const component of connectedComponents(nodes, edges)) {
    const count = component.length;
    const radius =
      count === 1 ? 0 : count === 2 ? NODE_W / 2 + GAP : ((NODE_W + GAP) * count) / (2 * Math.PI);
    const boxW = 2 * radius + NODE_W + GAP;
    const boxH = 2 * radius + NODE_H + GAP;
    if (cursorX + boxW > CANVAS_W && cursorX > 0) {
      cursorX = 0;
      cursorY += rowHeight;
      rowHeight = 0;
    }
    const center = { x: cursorX + boxW / 2, y: cursorY + boxH / 2 };
    component.forEach((id, index) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
      positions.set(id, {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      });
    });
    cursorX += boxW;
    rowHeight = Math.max(rowHeight, boxH);
  }
  return { positions, width: CANVAS_W, height: cursorY + rowHeight };
}

function clipToRect(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const scale = Math.min(
    dx ? Math.abs((NODE_W / 2 + 4) / dx) : Infinity,
    dy ? Math.abs((NODE_H / 2 + 4) / dy) : Infinity,
  );
  return { x: to.x - dx * scale, y: to.y - dy * scale };
}

function RelationGraph({ nodes, edges }) {
  const { linked, unlinked, positions, width, height } = useMemo(() => {
    const linkedIds = new Set(edges.flatMap((edge) => [edge.source_id, edge.target_id]));
    const linked = nodes.filter((node) => linkedIds.has(node.id));
    const unlinked = nodes.filter((node) => !linkedIds.has(node.id));
    return { linked, unlinked, ...layout(linked, edges) };
  }, [nodes, edges]);

  return (
    <>
      {!edges.length ? (
        <EmptyState>등록된 프로젝트 관계가 없습니다.</EmptyState>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="mx-auto h-auto w-full"
          style={{ maxWidth: width }}
          role="img"
          aria-label="프로젝트 관계도"
        >
          <defs>
            <marker
              id="relation-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
            </marker>
          </defs>
          {edges.map((edge) => {
            const source = positions.get(edge.source_id);
            const target = positions.get(edge.target_id);
            if (!source || !target) return null;
            const color = relationColors[edge.relation_type];
            const start = clipToRect(target, source);
            const end = clipToRect(source, target);
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;
            const label = edge.label || relationLabels[edge.relation_type];
            return (
              <g key={edge.id}>
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={color}
                  strokeWidth="2"
                  markerEnd="url(#relation-arrow)"
                />
                <rect
                  x={midX - label.length * 3.5 - 4}
                  y={midY - 9}
                  width={label.length * 7 + 8}
                  height="18"
                  rx="4"
                  fill="white"
                  fillOpacity="0.9"
                />
                <text
                  x={midX}
                  y={midY + 4}
                  textAnchor="middle"
                  className="fill-slate-500 text-[12px]"
                >
                  {label}
                </text>
              </g>
            );
          })}
          {linked.map((node) => {
            const position = positions.get(node.id);
            return (
              <Link key={node.id} to={`/projects/${node.id}`}>
                <rect
                  x={position.x - 75}
                  y={position.y - 26}
                  width="150"
                  height="52"
                  rx="12"
                  fill="white"
                  stroke={statusColors[node.status] || '#94a3b8'}
                  strokeWidth="3"
                />
                <text
                  x={position.x}
                  y={position.y + 5}
                  textAnchor="middle"
                  className="fill-slate-800 text-sm"
                >
                  {node.name.length > 18 ? `${node.name.slice(0, 17)}…` : node.name}
                </text>
              </Link>
            );
          })}
        </svg>
      )}
      {unlinked.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500">
          <span className="mr-2 font-medium">관계 없는 프로젝트 ({unlinked.length})</span>
          {unlinked.map((node) => (
            <Link
              key={node.id}
              to={`/projects/${node.id}`}
              className="mr-2 inline-block rounded bg-slate-100 px-2 py-0.5 hover:bg-slate-200"
            >
              {node.name}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function Legend({ className = '' }) {
  return (
    <div className={`flex flex-wrap gap-4 text-sm text-slate-600 ${className}`}>
      {Object.entries(relationLabels).map(([type, label]) => (
        <div key={type} className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: relationColors[type] }}
          />
          {label}
        </div>
      ))}
    </div>
  );
}

const modes = [
  ['all', '전체'],
  ['group', '그룹별'],
];

export default function RelationsPage() {
  const [graph, setGraph] = useState(null);
  const [mode, setMode] = useState('all');
  useEffect(() => {
    api('/relations/graph')
      .then(setGraph)
      .catch(() => setGraph({ nodes: [], edges: [] }));
  }, []);

  const groups = useMemo(() => {
    if (!graph) return [];
    const names = [...new Set(graph.nodes.map((node) => node.group_name || '미분류'))].sort(
      (a, b) => (a === '미분류' ? 1 : b === '미분류' ? -1 : a.localeCompare(b)),
    );
    return names.map((name) => {
      const nodes = graph.nodes.filter((node) => (node.group_name || '미분류') === name);
      const ids = new Set(nodes.map((node) => node.id));
      const edges = graph.edges.filter(
        (edge) => ids.has(edge.source_id) && ids.has(edge.target_id),
      );
      return { name, nodes, edges };
    });
  }, [graph]);

  if (!graph) return <Spinner />;
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="관계도" description="프로젝트 간 의존성과 연결 관계를 확인하세요." />
        <div className="flex shrink-0 rounded-lg border border-slate-200 bg-white p-1 text-sm">
          {modes.map(([value, label]) => (
            <button
              key={value}
              className={`rounded px-3 py-1 ${mode === value ? 'bg-slate-900 text-white' : 'text-slate-500'}`}
              onClick={() => setMode(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {mode === 'all' ? (
        <Card>
          <RelationGraph nodes={graph.nodes} edges={graph.edges} />
          <Legend className="mt-4 border-t border-slate-100 pt-4" />
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <Card key={group.name}>
              <h2 className="mb-4 text-sm font-semibold text-slate-500">
                {group.name} <span className="font-normal">({group.nodes.length})</span>
              </h2>
              <RelationGraph nodes={group.nodes} edges={group.edges} />
            </Card>
          ))}
          <Card>
            <Legend />
          </Card>
        </div>
      )}
    </>
  );
}
