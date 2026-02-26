export type GuestColorToken = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'teal' | 'pink';

export const guestColors: GuestColorToken[] = [
  'red',
  'blue',
  'green',
  'yellow',
  'purple',
  'orange',
  'teal',
  'pink',
];

export function getGuestColorClass(token: GuestColorToken): string {
  const colorMap: Record<GuestColorToken, string> = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-400',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    teal: 'bg-teal-400',
    pink: 'bg-pink-400',
  };
  return colorMap[token] || 'bg-gray-500';
}

export function getGuestColorStyle(token: GuestColorToken): React.CSSProperties {
  const colorMap: Record<GuestColorToken, string> = {
    red: '#ef4444', // red-500
    blue: '#3b82f6', // blue-500
    green: '#22c55e', // green-500
    yellow: '#facc15', // yellow-400
    purple: '#a855f7', // purple-500
    orange: '#f97316', // orange-500
    teal: '#2dd4bf', // teal-400
    pink: '#f472b6', // pink-400
  };
  return { backgroundColor: colorMap[token] || '#6b7280' };
}
