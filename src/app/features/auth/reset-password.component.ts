import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth.service';
import { UiButton, UiFormField, UiInput } from '../../shared/ui';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, MatSnackBarModule, UiButton, UiFormField, UiInput],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  loading = signal(false);
  token = signal('');

  form = this.fb.nonNullable.group({
    token: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password2: ['', Validators.required],
  });

  ngOnInit(): void {
    const fromQuery = this.route.snapshot.queryParamMap.get('token');
    if (fromQuery) {
      this.token.set(fromQuery);
      this.form.patchValue({ token: fromQuery });
    }
  }

  invalid(field: 'token' | 'password' | 'password2'): boolean {
    const c = this.form.controls[field];
    return c.touched && c.invalid;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { token, password, password2 } = this.form.getRawValue();
    if (password !== password2) {
      this.snack.open('Las contraseñas no coinciden', 'Cerrar', { duration: 4000 });
      return;
    }
    this.loading.set(true);
    this.auth.resetPassword(token, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.snack.open('Contraseña actualizada. Ya puede iniciar sesión.', 'OK', {
          duration: 5000,
        });
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.detail ?? 'Token inválido o expirado';
        this.snack.open(typeof msg === 'string' ? msg : 'Error al restablecer', 'Cerrar', {
          duration: 5000,
        });
      },
    });
  }
}
