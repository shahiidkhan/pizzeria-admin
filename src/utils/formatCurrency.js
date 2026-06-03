export function formatCurrency(value) {
  const amount = Number(value || 0);
  return `Rs. ${amount.toLocaleString('en-PK', {
    maximumFractionDigits: 0,
  })}`;
}
