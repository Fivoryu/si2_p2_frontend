import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export function authGuard(allowedRoles: string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn) {
      return router.createUrlTree(['/login']);
    }
    if (auth.role && allowedRoles.includes(auth.role)) {
      return true;
    }
    return router.createUrlTree(['/login']);
  };
}

export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn) {
    return router.createUrlTree([defaultRouteForRole(auth.role)]);
  }
  return true;
};

export function defaultRouteForRole(role?: string): string {
  switch (role) {
    case 'ADMIN_PLATAFORMA':
      return '/kpis';
    case 'ADMIN_TENANT':
      return '/kpis';
    case 'TALLER':
      return '/requests';
    default:
      return '/requests';
  }
}
