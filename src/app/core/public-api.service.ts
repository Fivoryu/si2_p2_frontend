import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

export interface SaasPlan {
  id: string;
  nombre: string;
  max_talleres: number;
  max_tecnicos: number;
  ia_avanzada: boolean;
  precio_mensual: number;
  moneda: string;
}

export interface TenantSignupPayload {
  nombre_organizacion: string;
  dominio?: string;
  plan_id: string;
  admin_nombre: string;
  admin_email: string;
  admin_telefono?: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class PublicApiService {
  constructor(private api: ApiService) {}

  getPlans() {
    return this.api.get<SaasPlan[]>('/public/plans');
  }

  signupTenant(body: TenantSignupPayload) {
    return this.api.post<{ tenant_id: string; usuario_id: string; mensaje: string }>(
      '/public/signup',
      body
    );
  }
}
