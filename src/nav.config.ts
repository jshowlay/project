export type NavItem = {
  path: string;
  label: string;
  icon: 'layout-dashboard' | 'radio' | 'bookmark' | 'bell-ring' | 'plug' | 'trending-up';
  hotkey: string;          // e.g., 'g d'
  hidden?: boolean;        // hide from tabs, still routable
};

export const NAV: NavItem[] = [
  { path: '/',            label: 'Dashboard',    icon: 'layout-dashboard', hotkey: 'g d' },
  { path: '/trends',      label: 'Trends',       icon: 'trending-up',       hotkey: 'g t' },
  { path: '/live',        label: 'Live',         icon: 'radio',            hotkey: 'g l' },
  { path: '/saved',       label: 'Saved',        icon: 'bookmark',         hotkey: 'g s' },
  { path: '/alerts',      label: 'Alerts',       icon: 'bell-ring',        hotkey: 'g a' },
  { path: '/integrations',label: 'Integrations', icon: 'plug',             hotkey: 'g i', hidden: true },
];
