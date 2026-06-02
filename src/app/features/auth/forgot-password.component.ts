import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth.service';
import { UiButton, UiFormField, UiInput } from '../../shared/ui';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, MatSnackBarModule, UiButton, UiFormField, UiInput],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private snack = inject(MatSnackBar);

  loading = signal(false);
  sent = signal(false);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  invalid(field: 'email'): boolean {
    const c = this.form.controls[field];
    return c.touched && c.invalid;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading.set(true);
    const { email } = this.form.getRawValue();
    this.auth.forgotPassword(email).subscribe({
      next: () => {
        this.loading.set(false);
        this.sent.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.detail ?? 'No se pudo enviar el enlace';
        this.snack.open(typeof msg === 'string' ? msg : 'Error al enviar', 'Cerrar', {
          duration: 4000,
        });
      },
    });
  }
}
