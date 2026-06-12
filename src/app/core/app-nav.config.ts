/** Roles con acceso web según JWT del backend. */
export type AppRole = 'TALLER' | 'ADMIN_TENANT' | 'ADMIN_PLATAFORMA';

export interface AppNavItem {
  label: string;
  path: string;
  icon: string;
  roles: AppRole[];
  /** Casos de uso WEB cubiertos por esta entrada (CapturaDeRequisitos.md). */
  cuIds: string[];
}

/**
 * Navegación lateral por rol.
 * CONDUCTOR: CU-04/05/06 son MÓVIL; la app web no expone rutas de conductor.
 */
export const APP_NAV_ITEMS: AppNavItem[] = [
  {
    label: 'Bandeja de solicitudes',
    path: '/requests',
    icon: 'inbox',
    roles: ['TALLER', 'ADMIN_TENANT'],
    cuIds: ['CU-14', 'CU-24', 'CU-25', 'CU-26', 'CU-33', 'CU-35', 'CU-36'],
  },
  {
    label: 'Disponibilidad',
    path: '/availability',
    icon: 'toggle_on',
    roles: ['TALLER'],
    cuIds: ['CU-09'],
  },
  {
    label: 'Técnicos',
    path: '/tecnicos',
    icon: 'engineering',
    roles: ['TALLER'],
    cuIds: ['CU-08'],
  },
  {
    label: 'Talleres',
    path: '/talleres',
    icon: 'store',
    roles: ['ADMIN_TENANT'],
    cuIds: ['CU-07'],
  },
  {
    label: 'Técnicos',
    path: '/tecnicos',
    icon: 'engineering',
    roles: ['ADMIN_TENANT'],
    cuIds: ['CU-08'],
  },
  {
    label: 'Dashboard KPIs',
    path: '/kpis',
    icon: 'bar_chart',
    roles: ['ADMIN_TENANT', 'ADMIN_PLATAFORMA'],
    cuIds: ['CU-42', 'CU-43', 'CU-44'],
  },
  {
    label: 'Reportes inteligentes',
    path: '/reportes',
    icon: 'query_stats',
    roles: ['ADMIN_TENANT', 'ADMIN_PLATAFORMA'],
    cuIds: ['CU-50'],
  },
  {
    label: 'Configuración SLA',
    path: '/sla',
    icon: 'schedule',
    roles: ['ADMIN_PLATAFORMA'],
    cuIds: ['CU-45'],
  },
  {
    label: 'Roles y Permisos',
    path: '/roles',
    icon: 'admin_panel_settings',
    roles: ['ADMIN_TENANT', 'ADMIN_PLATAFORMA'],
    cuIds: ['CU-46', 'CU-47'],
  },
  {
    label: 'Administración de tenants',
    path: '/admin/tenants',
    icon: 'business',
    roles: ['ADMIN_PLATAFORMA'],
    cuIds: ['CU-46', 'CU-47', 'CU-48'],
  },
];

export const ROLE_LABELS: Record<string, string> = {
  TALLER: 'Taller',
  ADMIN_TENANT: 'Admin tenant',
  ADMIN_PLATAFORMA: 'Admin plataforma',
  CONDUCTOR: 'Conductor',
};

export function navItemsForRole(role?: string): AppNavItem[] {
  if (!role) return [];
  return APP_NAV_ITEMS.filter((item) => item.roles.includes(role as AppRole));
}
