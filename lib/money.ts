export function formatRupees(paise: number): string {
  const rupees = paise / 100;
  // Indian grouping: last 3 digits, then 2-digit groups
  return '₹' + rupees.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}
