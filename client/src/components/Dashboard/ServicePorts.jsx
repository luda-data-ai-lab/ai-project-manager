import { ExternalLink, Play, RefreshCw, Square } from 'lucide-react';
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
  const start = async (service) => {
    try {
      await api(`/services/${service.project_id}/start`, { method: 'POST' });
      toast.success('실행 명령을 시작했습니다.');
      setTimeout(load, 1500);
    } catch (error) {
      toast.error(error.message);
    }
  };
  const stop = async (service) => {
    try {
      await api(`/services/${service.project_id}/stop`, { method: 'POST' });
      toast.success('프로세스를 중지했습니다.');
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  };
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
            <div key={service.project_id} className="mb-3 rounded-lg bg-slate-50 p-3">
              <div className="flex items-center justify-between">
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
                    className={
                      service.running ? 'text-sm text-green-600' : 'text-sm text-slate-400'
                    }
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
                  {service.process?.running ? (
                    <Button
                      variant="secondary"
                      className="px-2 py-1 text-xs"
                      onClick={() => stop(service)}
                    >
                      <Square size={13} className="mr-1 inline" />
                      중지
                    </Button>
                  ) : !service.running ? (
                    <Button
                      variant="secondary"
                      className="px-2 py-1 text-xs"
                      disabled={!service.can_start}
                      title={
                        !service.can_start ? '설정 탭에서 실행 명령어를 입력하세요' : undefined
                      }
                      onClick={() => start(service)}
                    >
                      <Play size={13} className="mr-1 inline" />
                      실행
                    </Button>
                  ) : null}
                </div>
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
