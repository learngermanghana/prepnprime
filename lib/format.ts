export const formatGHS = (value?: number) => {
  if (typeof value !== 'number') return 'Price on request';
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: 2
  }).format(value);
};

export const formatMinorGHS = (value?: number) => {
  if (typeof value !== 'number') return 'Pending';
  return formatGHS(value / 100);
};
