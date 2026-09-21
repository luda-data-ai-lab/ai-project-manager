export function notFound(_request, response) {
  response.status(404).json({ success: false, error: '요청한 리소스를 찾을 수 없습니다.' });
}
export function errorHandler(error, _request, response, _next) {
  console.error(error);
  const status = error.status || (error.code === 'SQLITE_CONSTRAINT_CHECK' ? 400 : 500);
  response
    .status(status)
    .json({ success: false, error: status === 500 ? '서버 오류가 발생했습니다.' : error.message });
}
