import {
  DOC_TYPES,
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  ISSUE_TYPES,
  PRIORITIES,
  PROJECT_STATUSES,
  TASK_STATUSES,
  TOOLS,
} from '../models/enums.js';
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
  return null;
};
export const validateMemo = (body) =>
  !body.last_work?.trim() ? '마지막 작업은 필수입니다.' : null;
export const validateConfig = (body) =>
  body && typeof body === 'object' ? null : '설정 형식이 올바르지 않습니다.';
export const validatePrompt = (body) => {
  if (!body.prompt_text?.trim()) return '프롬프트 내용은 필수입니다.';
  if (!valid(body.tool, TOOLS)) return '유효하지 않은 도구입니다.';
  return null;
};
export const validateIssue = (body, partial = false) => {
  if (!partial && !body.title?.trim()) return '이슈 제목은 필수입니다.';
  if (body.title !== undefined && !String(body.title).trim()) return '이슈 제목은 필수입니다.';
  if (!valid(body.type, ISSUE_TYPES)) return '유효하지 않은 이슈 유형입니다.';
  if (!valid(body.status, ISSUE_STATUSES)) return '유효하지 않은 이슈 상태입니다.';
  if (!valid(body.priority, ISSUE_PRIORITIES)) return '유효하지 않은 이슈 우선순위입니다.';
  return null;
};
export const validateDocument = (body, partial = false) => {
  if (!partial && !body.title?.trim()) return '문서 제목은 필수입니다.';
  if (body.title !== undefined && !String(body.title).trim()) return '문서 제목은 필수입니다.';
  if (!valid(body.doc_type, DOC_TYPES)) return '유효하지 않은 문서 유형입니다.';
  return null;
};
