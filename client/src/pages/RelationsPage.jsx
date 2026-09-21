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

export default function RelationsPage() {
  const [graph, setGraph] = useState(null);
  useEffect(() => {
    api('/relations/graph')
      .then(setGraph)
      .catch(() => setGraph({ nodes: [], edges: [] }));
  }, []);

  const positions = useMemo(() => {
    if (!graph) return new Map();
    const center = { x: 400, y: 300 };
    const radius = Math.min(220, Math.max(130, graph.nodes.length * 32));
    return new Map(
      graph.nodes.map((node, index) => {
        const angle = -Math.PI / 2 + (index * 2 * Math.PI) / Math.max(graph.nodes.length, 1);
        return [
          node.id,
          {
            ...center,
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle),
          },
        ];
      }),
    );
  }, [graph]);

  if (!graph) return <Spinner />;
  return (
    <>
      <PageHeader title="관계도" description="프로젝트 간 의존성과 연결 관계를 확인하세요." />
      {!graph.edges.length ? (
        <EmptyState>등록된 프로젝트 관계가 없습니다.</EmptyState>
      ) : (
        <Card>
          <svg
            viewBox="0 0 800 600"
            className="h-auto w-full"
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
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
              </marker>
            </defs>
            {graph.edges.map((edge) => {
              const source = positions.get(edge.source_id);
              const target = positions.get(edge.target_id);
              if (!source || !target) return null;
              const color = relationColors[edge.relation_type];
              const midX = (source.x + target.x) / 2;
              const midY = (source.y + target.y) / 2;
              return (
                <g key={edge.id}>
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={color}
                    strokeWidth="2"
                    markerEnd="url(#relation-arrow)"
                  />
                  <text
                    x={midX}
                    y={midY - 8}
                    textAnchor="middle"
                    className="fill-slate-500 text-[12px]"
                  >
                    {edge.label || relationLabels[edge.relation_type]}
                  </text>
                </g>
              );
            })}
            {graph.nodes.map((node) => {
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
          <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-sm text-slate-600">
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
        </Card>
      )}
    </>
  );
}
