export interface NavigationItem {
  label: string;
  path: string;
  icon: string;
  exact?: boolean;
  countKey?: string;
  keywords?: string[];
}

export interface NavigationGroup {
  label?: string;
  items: NavigationItem[];
}

export const NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    items: [{ label: 'Overview', path: '/', icon: 'fa-house', exact: true, keywords: ['dashboard', 'home'] }],
  },
  {
    label: 'Moderation',
    items: [
      { label: 'Abuse reports', path: '/abuse-reports', icon: 'fa-flag', countKey: 'pendingAbuseReports', keywords: ['flags', 'complaints'] },
      { label: 'Reports', path: '/reports', icon: 'fa-rectangle-list', countKey: 'flaggedReports', keywords: ['listings', 'lost', 'found'] },
      { label: 'Claims', path: '/claims', icon: 'fa-shield-halved', countKey: 'pendingClaims', keywords: ['ownership', 'verification'] },
      { label: 'Matches', path: '/matches', icon: 'fa-code-compare', keywords: ['matching'] },
    ],
  },
  {
    label: 'People',
    items: [{ label: 'Users', path: '/users', icon: 'fa-user-group', keywords: ['accounts', 'members'] }],
  },
  {
    label: 'Configuration',
    items: [
      { label: 'Definitions', path: '/definitions', icon: 'fa-sliders', keywords: ['categories', 'questions', 'templates', 'matching config'] },
      { label: 'Audit log', path: '/audit-log', icon: 'fa-clock-rotate-left', keywords: ['history', 'activity', 'actions'] },
    ],
  },
];
