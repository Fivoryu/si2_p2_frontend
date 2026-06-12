import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';

export interface JwtClaims {
  sub: string;
  rol: string;
  tenant?: string;
  jti?: string;
  exp?: number;
  must_change_password?: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = environment.apiUrl;
  private readonly storageKey = 'jwt';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(email: string, password: string, tenantId?: string) {
    const body: { email: string; password: string; tenant_id?: string } = { email, password };
    if (tenantId) body.tenant_id = tenantId;
    return this.http
      .post<LoginResponse>(`${this.base}/auth/login`, body)
      .pipe(tap((r) => localStorage.setItem(this.storageKey, r.access_token)));
  }

  registerConductor(payload: {
    nombre: string;
    email: string;
    telefono?: string;
    password: string;
  }) {
    return this.http.post<{ id: string }>(`${this.base}/auth/register`, payload);
  }

  forgotPassword(email: string) {
    return this.http.post<{ detail: string }>(`${this.base}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post<void>(`${this.base}/auth/reset-password`, {
      token,
      new_password: newPassword,
    });
  }

  get token(): string | null {
    return localStorage.getItem(this.storageKey);
  }

  get claims(): JwtClaims | null {
    const t = this.token;
    if (!t) return null;
    try {
      return jwtDecode<JwtClaims>(t);
    } catch {
      return null;
    }
  }

  get role(): string | undefined {
    return this.claims?.rol;
  }

  get tenantId(): string | undefined {
    return this.claims?.tenant;
  }

  get userId(): string | undefined {
    return this.claims?.sub;
  }

  get mustChangePassword(): boolean {
    return this.claims?.must_change_password === true;
  }

  changePassword(oldPassword: string, newPassword: string) {
    return this.http.post<void>(`${this.base}/auth/change-password`, {
      password_actual: oldPassword,
      password_nueva: newPassword,
    });
  }

  get isLoggedIn(): boolean {
    const c = this.claims;
    if (!c?.exp) return !!c;
    return Date.now() < c.exp * 1000;
  }

  hasRole(...roles: string[]): boolean {
    const r = this.role;
    return !!r && roles.includes(r);
  }

  logout(): void {
    if (this.token) {
      this.http.post(`${this.base}/auth/logout`, {}).subscribe({ error: () => {} });
    }
    localStorage.removeItem(this.storageKey);
    this.router.navigate(['/login']);
  }
}
