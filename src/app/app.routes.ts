import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './core/auth.guard';
import { LoginComponent } from './features/auth/login.component';
import { ChangePasswordComponent } from './features/auth/change-password.component';
import { SignupSuccessComponent } from './features/auth/signup-success.component';
import { RequestsComponent } from './features/requests/requests.component';
import { KpisComponent } from './features/kpis/kpis.component';
import { ReportesComponent } from './features/reportes/reportes.component';
import { SlaComponent } from './features/sla/sla.component';
import { TenantsComponent } from './features/admin/tenants.component';
import { RolesComponent } from './features/roles/roles.component';
import { AvailabilityComponent } from './features/availability/availability.component';
import { TalleresComponent } from './features/workshops/talleres.component';
import { TecnicosComponent } from './features/technicians/tecnicos.component';
import { RegisterComponent } from './features/auth/register.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [loginGuard] },
  { path: 'registro', component: RegisterComponent, canActivate: [loginGuard] },
  { path: 'registro/exito', component: SignupSuccessComponent },
  { path: 'cambiar-contrasena', component: ChangePasswordComponent },
  {
    path: 'requests',
    component: RequestsComponent,
    canActivate: [authGuard(['TALLER', 'ADMIN_TENANT'])],
    data: { title: 'Bandeja de solicitudes' },
  },
  {
    path: 'availability',
    component: AvailabilityComponent,
    canActivate: [authGuard(['TALLER'])],
    data: { title: 'Disponibilidad del taller' },
  },
  {
    path: 'talleres',
    component: TalleresComponent,
    canActivate: [authGuard(['ADMIN_TENANT'])],
    data: { title: 'Talleres' },
  },
  {
    path: 'talleres/registrar',
    redirectTo: 'talleres',
    pathMatch: 'full',
  },
  {
    path: 'tecnicos',
    component: TecnicosComponent,
    canActivate: [authGuard(['ADMIN_TENANT', 'TALLER'])],
    data: { title: 'Técnicos' },
  },
  {
    path: 'tecnicos/registrar',
    redirectTo: 'tecnicos',
    pathMatch: 'full',
  },
  {
    path: 'kpis',
    component: KpisComponent,
    canActivate: [authGuard(['ADMIN_TENANT', 'ADMIN_PLATAFORMA'])],
    data: { title: 'Dashboard KPIs' },
  },
  {
    path: 'reportes',
    component: ReportesComponent,
    canActivate: [authGuard(['ADMIN_TENANT', 'ADMIN_PLATAFORMA'])],
    data: { title: 'Reportes Inteligentes' },
  },
  {
    path: 'sla',
    component: SlaComponent,
    canActivate: [authGuard(['ADMIN_PLATAFORMA'])],
    data: { title: 'Configuración SLA' },
  },
  {
    path: 'admin/tenants',
    component: TenantsComponent,
    canActivate: [authGuard(['ADMIN_PLATAFORMA'])],
    data: { title: 'Administración de tenants' },
  },
  {
    path: 'roles',
    component: RolesComponent,
    canActivate: [authGuard(['ADMIN_TENANT', 'ADMIN_PLATAFORMA'])],
    data: { title: 'Roles y Permisos' },
  },
  { path: '**', redirectTo: 'login' },
];
