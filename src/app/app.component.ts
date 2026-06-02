import { Component, computed, inject, signal } from '@angular/core';

import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { filter } from 'rxjs/operators';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from './core/auth.service';

import { isPublicAppRoute } from './core/public-routes';

import { navItemsForRole, ROLE_LABELS } from './core/app-nav.config';



@Component({

  selector: 'app-root',

  standalone: true,

  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],

  templateUrl: './app.component.html',

  styleUrl: './app.component.scss',

})

export class AppComponent {

  private auth = inject(AuthService);

  private router = inject(Router);



  pageTitle = signal('Panel');

  /** Reactive route path so showShell recomputes after login/navigation. */
  private currentUrl = signal(this.router.url);

  showShell = computed(() => {
    if (isPublicAppRoute(this.currentUrl())) {
      return false;
    }
    return this.auth.isLoggedIn;
  });



  visibleNav = computed(() => navItemsForRole(this.auth.role));



  roleLabel = computed(() => ROLE_LABELS[this.auth.role ?? ''] ?? this.auth.role ?? '');



  constructor() {

    this.router.events

      .pipe(

        filter((e): e is NavigationEnd => e instanceof NavigationEnd),

        takeUntilDestroyed()

      )

      .subscribe(() => {
        this.currentUrl.set(this.router.url);
        this.syncPageTitle();
      });

    this.syncPageTitle();

  }



  logout(): void {

    this.auth.logout();

  }



  private syncPageTitle(): void {

    let route = this.router.routerState.root;

    while (route.firstChild) {

      route = route.firstChild;

    }

    this.pageTitle.set((route.snapshot.data['title'] as string) ?? 'Panel');

  }

}

