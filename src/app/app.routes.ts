import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './core/auth.guard';
import { LoginComponent } from './features/auth/login.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password.component';
import { RequestsComponent } from './features/requests/requests.component';
import { KpisComponent } from './features/kpis/kpis.component';
import { SlaComponent } from './features/sla/sla.component';
import { TenantsComponent } from './features/admin/tenants.component';
import { AvailabilityComponent } from './features/availability/availability.component';
import { RegisterWorkshopComponent } from './features/workshops/register-workshop.component';
import { RegisterTechnicianComponent } from './features/technicians/register-technician.component';
import { SpecialtiesComponent } from './features/specialties/specialties.component';
import { DesignSystemComponent } from './features/design-system/design-system.component';
import { LandingComponent } from './features/landing/landing.component';
import { RegisterComponent } from './features/auth/register.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent, canActivate: [loginGuard] },
  {
    path: 'recuperar-contrasena',
    component: ForgotPasswordComponent,
    canActivate: [loginGuard],
    data: { title: 'Recuperar contraseña' },
  },
  {
    path: 'restablecer-contrasena',
    component: ResetPasswordComponent,
    canActivate: [loginGuard],
    data: { title: 'Restablecer contraseña' },
  },
  { path: 'registro', component: RegisterComponent, canActivate: [loginGuard] },
  { path: 'design-system', component: DesignSystemComponent },
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
    path: 'talleres/registrar',
    component: RegisterWorkshopComponent,
    canActivate: [authGuard(['ADMIN_TENANT'])],
    data: { title: 'Registrar taller' },
  },
  {
    path: 'tecnicos/registrar',
    component: RegisterTechnicianComponent,
    canActivate: [authGuard(['ADMIN_TENANT', 'TALLER'])],
    data: { title: 'Registrar técnico' },
  },
  {
    path: 'talleres/especialidades',
    component: SpecialtiesComponent,
    canActivate: [authGuard(['ADMIN_TENANT', 'TALLER'])],
    data: { title: 'Especialidades del taller' },
  },
  {
    path: 'kpis',
    component: KpisComponent,
    canActivate: [authGuard(['ADMIN_TENANT', 'ADMIN_PLATAFORMA'])],
    data: { title: 'Dashboard KPIs' },
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
  { path: '**', redirectTo: '' },
];
