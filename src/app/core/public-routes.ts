/** Rutas sin panel lateral (marketing, auth, registro). */
export function isPublicAppRoute(path: string): boolean {
  const p = path.split('?')[0].split('#')[0];
  if (p === '/' || p === '') return true;
  const exact = [
    '/login',
    '/registro',
    '/recuperar-contrasena',
    '/restablecer-contrasena',
    '/design-system',
  ];
  return exact.some((route) => p === route || p.startsWith(`${route}/`));
}
