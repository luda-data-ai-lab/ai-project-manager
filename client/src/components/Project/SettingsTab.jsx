import { useState } from 'react';
import { mutate } from '../../utils/api';
import { inputClass } from '../../utils/styles';
import { Button, Card, Field } from '../common';
export default function SettingsTab({ id, data, onSaved }) {
  const [env, setEnv] = useState(data.env || {});
  const [git, setGit] = useState(data.git || {});
  const [deploy, setDeploy] = useState(data.deploy || {});
  const save = async (type, values) => {
    await mutate(
      `/projects/${id}/${type}`,
      { method: 'PUT', body: JSON.stringify(values) },
      '저장했습니다.',
    );
    onSaved();
  };
  const form = (title, values, setValues, type, fields) => (
    <Card>
      <h2 className="mb-4 font-semibold">{title}</h2>
      <div className="space-y-3">
        {fields.map(([key, label, placeholder, type = 'text']) => (
          <Field key={key} label={label}>
            <input
              className={inputClass}
              type={type}
              placeholder={placeholder}
              value={values[key] || ''}
              onChange={(event) => setValues({ ...values, [key]: event.target.value })}
            />
          </Field>
        ))}
      </div>
      <Button className="mt-4" onClick={() => save(type, values)}>
        저장
      </Button>
    </Card>
  );
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {form('실행 환경', env, setEnv, 'env', [
        ['source_folder', '소스 폴더'],
        ['run_command', '실행 명령어'],
        ['run_port', '실행 포트', '3000'],
        ['access_url', '접속 URL'],
        ['runtime', '개발 환경'],
        ['install_command', '설치 명령어'],
        ['env_vars_location', '환경변수 위치'],
        ['db_config_path', 'DB 설정 경로'],
      ])}
      {form('Git 정보', git, setGit, 'git', [
        ['repo_url', '저장소 URL'],
        ['branch', '브랜치'],
        ['last_commit', '최근 커밋'],
        ['last_pushed_at', '마지막 push', '2026-09-20T16:00:00Z'],
      ])}
      {form('배포 정보', deploy, setDeploy, 'deploy', [
        ['service_url', '서비스 URL'],
        ['infra', '인프라', '예: local, vercel, aws'],
        ['version', '버전'],
        ['deployed_at', '배포일', '', 'date'],
        ['deploy_method', '배포 방법', '예: manual, ci/cd'],
      ])}
    </div>
  );
}
