import { ExternalLink, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Button, Card, EmptyState, Spinner } from '../common';
import { api } from '../../utils/api';

export default function ServicePorts() {
  const [services, setServices] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      setServices(await api('/services'));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">서비스 포트</h2>
        <Button
          variant="secondary"
          className="px-2 py-1"
          aria-label="서비스 포트 새로고침"
          title="새로고침"
          disabled={loading}
          onClick={load}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>
      {services === null || loading ? (
        <Spinner />
      ) : services.length ? (
        services.map((service) => {
          const accessUrl = service.access_url || `http://localhost:${service.run_port}`;
          return (
            <div
              key={service.project_id}
              className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 p-3"
            >
              <Link to={`/projects/${service.project_id}`} className="flex items-center gap-2">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                    service.running ? 'bg-green-500' : 'bg-slate-300'
                  }`}
                  aria-label={service.running ? '실행 중' : '정지'}
                />
                <span className="font-medium">{service.project_name}</span>
              </Link>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-slate-600">:{service.run_port}</span>
                <span
                  className={service.running ? 'text-sm text-green-600' : 'text-sm text-slate-400'}
                >
                  {service.running ? '실행 중' : '정지'}
                </span>
                {service.running && (
                  <a
                    href={accessUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${service.project_name} 새 탭에서 열기`}
                    onClick={(event) => event.stopPropagation()}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <ExternalLink size={15} />
                  </a>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <EmptyState>실행 포트가 등록된 프로젝트가 없습니다.</EmptyState>
      )}
    </Card>
  );
}
