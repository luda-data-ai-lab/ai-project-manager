export function formatMoney(amount, currency) {
  const value = Number(amount) || 0;
  if (currency === 'USD')
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  return `₩${Math.round(value).toLocaleString('ko-KR')}`;
}
