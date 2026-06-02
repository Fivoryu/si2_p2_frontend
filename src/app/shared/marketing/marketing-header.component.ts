import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UiButton } from '../ui';
import { AuthService } from '../../core/auth.service';
import { defaultRouteForRole } from '../../core/auth.guard';

@Component({
  selector: 'app-marketing-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiButton],
  template: `
    <div class="mkt-header-wrap">
      <header class="mkt-header">
        <a routerLink="/" class="mkt-header__brand" (click)="closeMenu()">
          <span class="mkt-header__logo" aria-hidden="true">
            <span class="material-icons">car_repair</span>
          </span>
          <span>Emergencias<span class="mkt-header__brand-accent">BO</span></span>
        </a>

        <button
          type="button"
          class="mkt-header__menu-btn"
          aria-label="Menú"
          [attr.aria-expanded]="menuOpen()"
          (click)="toggleMenu()"
        >
          <span class="material-icons">{{ menuOpen() ? 'close' : 'menu' }}</span>
        </button>

        <nav class="mkt-header__nav" [class.mkt-header__nav--open]="menuOpen()" aria-label="Principal">
          <a routerLink="/" fragment="inicio" (click)="closeMenu()">Inicio</a>
          <a routerLink="/" fragment="funciones" (click)="closeMenu()">Funciones</a>
          <a routerLink="/" fragment="precios" (click)="closeMenu()">Precios</a>
          <a routerLink="/" fragment="contacto" (click)="closeMenu()">Contacto</a>
        </nav>

        <div class="mkt-header__actions" [class.mkt-header__actions--open]="menuOpen()">
          @if (auth.isLoggedIn) {
            <ui-button variant="primary" size="sm" (clicked)="goPanel()">Mi panel</ui-button>
          } @else {
            <a routerLink="/login" class="mkt-header__link" (click)="closeMenu()">Iniciar sesión</a>
            <ui-button variant="primary" size="sm" (clicked)="goRegister()">Crear cuenta</ui-button>
          }
        </div>
      </header>
    </div>
  `,
  styleUrl: './marketing-header.component.scss',
})
export class MarketingHeaderComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  menuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  goPanel(): void {
    this.closeMenu();
    this.router.navigate([defaultRouteForRole(this.auth.role)]);
  }

  goRegister(): void {
    this.closeMenu();
    this.router.navigate(['/registro']);
  }
}
