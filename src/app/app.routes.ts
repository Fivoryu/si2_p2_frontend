import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './core/auth.guard';
import { LoginComponent } from './features/auth/login.component';
import { RequestsComponent } from './features/requests/requests.component';
import { KpisComponent } from './features/kpis/kpis.component';
import { SlaComponent } from './features/sla/sla.component';
import { TenantsComponent } from './features/admin/tenants.component';
import { AvailabilityComponent } from './features/availability/availability.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [loginGuard] },
  {
    path: 'requests',
    component: RequestsComponent,
    canActivate: [authGuard(['TALLER', 'ADMIN_TENANT'])],
  },
  {
    path: 'availability',
    component: AvailabilityComponent,
    canActivate: [authGuard(['TALLER'])],
  },
  {
    path: 'kpis',
    component: KpisComponent,
    canActivate: [authGuard(['ADMIN_TENANT', 'ADMIN_PLATAFORMA'])],
  },
  {
    path: 'sla',
    component: SlaComponent,
    canActivate: [authGuard(['ADMIN_PLATAFORMA'])],
  },
  {
    path: 'admin/tenants',
    component: TenantsComponent,
    canActivate: [authGuard(['ADMIN_PLATAFORMA'])],
  },
  { path: '', redirectTo: 'requests', pathMatch: 'full' },
  { path: '**', redirectTo: 'requests' },
];
