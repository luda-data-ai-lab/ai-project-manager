import { useEffect, useState } from 'react';
import { DatabaseBackup, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, mutate } from '../utils/api';
import { Button, Card, Field, PageHeader, Spinner } from '../components/common';
import { inputClass } from '../utils/styles';

const modeLabels = {
  merge: '병합',
  replace: '전체 교체',
};

export default function BackupPage() {
  const [projects, setProjects] = useState(null);
  const [projectId, setProjectId] = useState('');
  const [mode, setMode] = useState('merge');
  const [file, setFile] = useState(null);
  const [counts, setCounts] = useState(null);

  const loadProjects = () =>
    api('/projects')
      .then((items) => {
        setProjects(items);
        setProjectId((current) =>
          items.some((item) => item.id === current) ? current : items[0]?.id || '',
        );
      })
      .catch((error) => toast.error(error.message));

  useEffect(() => {
    loadProjects();
  }, []);

  const importBackup = async (event) => {
    event.preventDefault();
    if (!file) {
      toast.error('가져올 JSON 파일을 선택해 주세요.');
      return;
    }
    if (mode === 'replace' && !window.confirm('모든 기존 데이터를 교체하시겠습니까?')) return;
    try {
      const payload = await file.text();
      const result = await mutate(
        `/import?mode=${mode}`,
        { method: 'POST', body: payload },
        '백업을 가져왔습니다.',
      );
      if (result) {
        setCounts(result.counts);
        await loadProjects();
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!projects) return <Spinner />;
  return (
    <>
      <PageHeader
        title="백업"
        description="프로젝트 데이터를 JSON 또는 Markdown으로 보관하고 복원하세요."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2">
            <Download size={18} />
            <h2 className="font-semibold">내보내기</h2>
          </div>
          <div className="mt-5 space-y-4">
            <a
              href="/api/export"
              download
              className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              전체 JSON 내보내기
            </a>
            <div className="border-t border-slate-100 pt-4">
              <Field label="프로젝트 선택">
                <select
                  className={inputClass}
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={projectId ? `/api/export/projects/${projectId}` : '#'}
                  download
                  className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  프로젝트 JSON
                </a>
                <a
                  href={projectId ? `/api/export/projects/${projectId}/markdown` : '#'}
                  download
                  className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  프로젝트 Markdown
                </a>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Upload size={18} />
            <h2 className="font-semibold">가져오기</h2>
          </div>
          <form onSubmit={importBackup} className="mt-5 space-y-4">
            <Field label="JSON 파일">
              <input
                type="file"
                accept=".json,application/json"
                className={inputClass}
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </Field>
            <div className="flex gap-4 text-sm">
              {Object.entries(modeLabels).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="import-mode"
                    value={value}
                    checked={mode === value}
                    onChange={(event) => setMode(event.target.value)}
                  />
                  {label}
                </label>
              ))}
            </div>
            <Button type="submit">JSON 가져오기</Button>
          </form>
          {counts && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold">가져온 레코드</h3>
              <table className="mt-2 w-full text-left text-xs">
                <tbody>
                  {Object.entries(counts).map(([table, count]) => (
                    <tr key={table} className="border-b border-slate-100 last:border-0">
                      <th className="py-1 font-medium text-slate-500">{table}</th>
                      <td className="py-1 text-right">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <DatabaseBackup size={18} />
            <h2 className="font-semibold">정기 백업</h2>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            DevTracker는 로컬 앱이므로 서버가 실행 중일 때 curl 또는 cron으로 정기 백업을 설정할 수
            있습니다.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">
            {`curl -o backup.json http://localhost:${__API_PORT__}/api/export\n0 3 * * * curl -fsS -o "$HOME/devtracker-backup-$(date +%Y%m%d).json" http://localhost:${__API_PORT__}/api/export`}
          </pre>
        </Card>
      </div>
    </>
  );
}
