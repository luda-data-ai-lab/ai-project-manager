import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Badge, EmptyState, PageHeader, Spinner } from '../components/common';
import { api } from '../utils/api';

const types = [
  ['', '전체'],
  ['project', '프로젝트'],
  ['task', '작업'],
  ['prompt', '프롬프트'],
  ['document', '문서'],
  ['issue', '이슈'],
];
const typeLabels = Object.fromEntries(types);
const typeColors = {
  project: 'bg-violet-100 text-violet-700',
  task: 'bg-blue-100 text-blue-700',
  prompt: 'bg-amber-100 text-amber-700',
  document: 'bg-emerald-100 text-emerald-700',
  issue: 'bg-red-100 text-red-700',
};

function ResultSnippet({ value }) {
  const parts = (value || '').split(/(\[\[.*?\]\])/g);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith('[[') && part.endsWith(']]') ? (
          <mark key={index} className="rounded bg-yellow-100 px-0.5 text-slate-800">
            {part.slice(2, -2)}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

function resultLink(result) {
  if (result.entity_type === 'project') return `/projects/${result.entity_id}`;
  return `/projects/${result.project_id}?tab=${result.entity_type}s`;
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [project, setProject] = useState(searchParams.get('project') || '');
  const [projects, setProjects] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    api('/projects')
      .then(setProjects)
      .catch((error) => toast.error(error.message));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextParams = new URLSearchParams();
      if (query.trim()) nextParams.set('q', query.trim());
      if (type) nextParams.set('type', type);
      if (project) nextParams.set('project', project);
      setSearchParams(nextParams, { replace: true });
      if (!query.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const params = new URLSearchParams({ q: query.trim() });
      if (type) params.set('type', type);
      if (project) params.set('project', project);
      api(`/search?${params}`)
        .then(setResults)
        .catch((error) => {
          setResults([]);
          toast.error(error.message);
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query, type, project, setSearchParams]);

  return (
    <>
      <PageHeader
        title="통합 검색"
        description="프로젝트, 작업, 프롬프트, 문서, 이슈를 한 번에 검색합니다."
      />
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="검색어를 입력하세요"
          className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none ring-slate-300 focus:ring-2"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {types.map(([value, label]) => (
            <button
              key={value || 'all'}
              type="button"
              onClick={() => setType(value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                type === value
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={project}
          onChange={(event) => setProject(event.target.value)}
          className="mt-4 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm md:w-80"
        >
          <option value="">모든 프로젝트</option>
          {projects.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      {!query.trim() ? (
        <EmptyState>검색어를 입력하면 결과가 표시됩니다.</EmptyState>
      ) : loading ? (
        <Spinner />
      ) : results.length === 0 ? (
        <EmptyState>검색 결과가 없습니다.</EmptyState>
      ) : (
        <div className="space-y-3">
          {results.map((result) => (
            <Link
              key={`${result.entity_type}-${result.entity_id}`}
              to={resultLink(result)}
              className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  label={typeLabels[result.entity_type]}
                  color={typeColors[result.entity_type]}
                />
                <h2 className="font-semibold text-slate-900">{result.title || '제목 없음'}</h2>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                <ResultSnippet value={result.snippet} />
              </p>
              <p className="mt-2 text-xs text-slate-400">{result.project_name}</p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
