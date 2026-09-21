import { PRIORITIES, PROJECT_STATUSES, TASK_STATUSES } from '../models/enums.js';
const valid = (value, values) => value === undefined || values.includes(value);
export const validateProject = (body, partial = false) => {
  if (!partial && !body.name?.trim()) return '프로젝트 이름은 필수입니다.';
  if (body.name !== undefined && !String(body.name).trim()) return '프로젝트 이름은 필수입니다.';
  if (!valid(body.status, PROJECT_STATUSES)) return '유효하지 않은 프로젝트 상태입니다.';
  if (!valid(body.priority, PRIORITIES)) return '유효하지 않은 우선순위입니다.';
  return null;
};
export const validateTask = (body, partial = false) => {
  if (!partial && !body.title?.trim()) return '작업 제목은 필수입니다.';
  if (body.title !== undefined && !String(body.title).trim()) return '작업 제목은 필수입니다.';
  if (!valid(body.status, TASK_STATUSES)) return '유효하지 않은 작업 상태입니다.';
  if (body.due_date !== undefined && body.due_date !== null) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.due_date)) return '마감일 형식은 YYYY-MM-DD 입니다.';
  }
  return null;
};
export const validateMemo = (body) =>
  !body.last_work?.trim() ? '마지막 작업은 필수입니다.' : null;
export const validateConfig = (body) =>
  body && typeof body === 'object' ? null : '설정 형식이 올바르지 않습니다.';
