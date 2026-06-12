import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth.service';
import { defaultRouteForRole } from '../../core/auth.guard';
import { UiButton, UiFormField, UiInput } from '../../shared/ui';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatSnackBarModule,
    UiButton,
    UiFormField,
    UiInput,
  ],
  template: `
    <div class="change-password-page">
      <div class="change-password-card">
        <h2>Cambiar contraseña</h2>
        <p class="subtitle">
          Tu contraseña temporal debe ser cambiada antes de continuar.
        </p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <ui-form-field label="Contraseña actual">
            <input
              uiInput
              type="password"
              formControlName="password_actual"
              placeholder="Tu contraseña temporal"
            />
          </ui-form-field>

          <ui-form-field label="Nueva contraseña">
            <input
              uiInput
              type="password"
              formControlName="password_nueva"
              placeholder="Mínimo 8 caracteres"
            />
          </ui-form-field>

          <ui-form-field label="Confirmar nueva contraseña">
            <input
              uiInput
              type="password"
              formControlName="password_confirm"
              placeholder="Repite la nueva contraseña"
            />
          </ui-form-field>

          <ui-button
            type="submit"
            [disabled]="loading()"
            [loading]="loading()"
          >
            Cambiar contraseña
          </ui-button>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .change-password-page {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: var(--bg-page, #f5f5f5);
      }
      .change-password-card {
        background: white;
        border-radius: 12px;
        padding: 32px;
        max-width: 400px;
        width: 100%;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      }
      h2 { margin: 0 0 8px; }
      .subtitle { color: #666; margin-bottom: 24px; }
    `,
  ],
})
export class ChangePasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  loading = signal(false);

  form = this.fb.nonNullable.group({
    password_actual: ['', Validators.required],
    password_nueva: ['', [Validators.required, Validators.minLength(8)]],
    password_confirm: ['', Validators.required],
  });

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { password_actual, password_nueva, password_confirm } =
      this.form.getRawValue();

    if (password_nueva !== password_confirm) {
      this.snack.open('Las contraseñas no coinciden', 'Cerrar', {
        duration: 4000,
      });
      return;
    }

    this.loading.set(true);
    this.auth.changePassword(password_actual, password_nueva).subscribe({
      next: () => {
        this.loading.set(false);
        this.snack.open('Contraseña actualizada', 'OK', { duration: 3000 });
        this.router.navigate([defaultRouteForRole(this.auth.role)]);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.detail ?? 'Error al cambiar contraseña';
        this.snack.open(msg, 'Cerrar', { duration: 5000 });
      },
    });
  }
}
