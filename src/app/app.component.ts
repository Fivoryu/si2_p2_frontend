import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { AuthService } from './core/auth.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles: string[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  showShell = computed(() => !this.router.url.startsWith('/login'));

  navItems: NavItem[] = [
    { label: 'Solicitudes', path: '/requests', icon: 'inbox', roles: ['TALLER', 'ADMIN_TENANT'] },
    { label: 'Disponibilidad', path: '/availability', icon: 'toggle_on', roles: ['TALLER'] },
    { label: 'KPIs', path: '/kpis', icon: 'bar_chart', roles: ['ADMIN_TENANT', 'ADMIN_PLATAFORMA'] },
    { label: 'SLA', path: '/sla', icon: 'schedule', roles: ['ADMIN_PLATAFORMA'] },
    { label: 'Tenants', path: '/admin/tenants', icon: 'business', roles: ['ADMIN_PLATAFORMA'] },
  ];

  visibleNav = computed(() => {
    const role = this.auth.role;
    if (!role) return [];
    return this.navItems.filter((n) => n.roles.includes(role));
  });

  roleLabel = computed(() => {
    const map: Record<string, string> = {
      TALLER: 'Taller',
      ADMIN_TENANT: 'Admin tenant',
      ADMIN_PLATAFORMA: 'Admin plataforma',
    };
    return map[this.auth.role ?? ''] ?? this.auth.role ?? '';
  });

  logout(): void {
    this.auth.logout();
  }
}
