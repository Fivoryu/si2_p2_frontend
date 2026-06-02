import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MarketingHeaderComponent } from '../../shared/marketing/marketing-header.component';
import { UiButton } from '../../shared/ui';
import { PublicApiService, type SaasPlan } from '../../core/public-api.service';
import { AuthService } from '../../core/auth.service';
import { defaultRouteForRole } from '../../core/auth.guard';

@Component({
  selector: 'app-landing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MarketingHeaderComponent, UiButton, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent implements OnInit {
  private publicApi = inject(PublicApiService);
  private auth = inject(AuthService);
  private router = inject(Router);

  plans = signal<SaasPlan[]>([]);
  plansLoading = signal(true);

  readonly features = [
    {
      icon: 'emergency',
      title: 'Emergencias en minutos',
      text: 'El conductor reporta falla, ubicación y evidencias desde el móvil. La IA prioriza y asigna el taller más cercano.',
    },
    {
      icon: 'build_circle',
      title: 'Panel para talleres',
      text: 'Bandeja en tiempo real, aceptar o rechazar solicitudes, actualizar estados y gestionar disponibilidad.',
    },
    {
      icon: 'analytics',
      title: 'KPIs y SLA',
      text: 'Tiempos de asignación, llegada, zonas críticas y cumplimiento de SLA por red de talleres.',
    },
    {
      icon: 'shield',
      title: 'Multi-tenant seguro',
      text: 'Cada red opera aislada. Ideal para cadenas de auxilio mecánico en Bolivia.',
    },
  ];

  readonly steps = [
    { n: '1', title: 'Regístrese', text: 'Elija plan en bolivianos y cree su red o cuenta de conductor.' },
    { n: '2', title: 'Configure talleres', text: 'Invite talleres, técnicos y tarifas por tipo de incidente.' },
    { n: '3', title: 'Atienda en vivo', text: 'WebSockets, pagos y seguimiento hasta cierre del servicio.' },
  ];

  ngOnInit(): void {
    this.publicApi.getPlans().subscribe({
      next: (p) => {
        this.plans.set(p);
        this.plansLoading.set(false);
      },
      error: () => this.plansLoading.set(false),
    });
  }

  formatBob(amount: number): string {
    if (amount <= 0) return 'Gratis';
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  planLabel(name: string): string {
    const map: Record<string, string> = {
      basico: 'Básico',
      profesional: 'Profesional',
      enterprise: 'Enterprise',
    };
    return map[name.toLowerCase()] ?? name;
  }

  signupPlan(planId: string): void {
    this.router.navigate(['/registro'], { queryParams: { tipo: 'taller', plan: planId } });
  }

  signupConductor(): void {
    this.router.navigate(['/registro'], { queryParams: { tipo: 'conductor' } });
  }

  goLogin(): void {
    this.router.navigate(['/login']);
  }

  goPanel(): void {
    this.router.navigate([defaultRouteForRole(this.auth.role)]);
  }

  isLoggedIn(): boolean {
    return this.auth.isLoggedIn;
  }
}
