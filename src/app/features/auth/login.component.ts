import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth.service';
import { defaultRouteForRole } from '../../core/auth.guard';
import { UiButton, UiFormField, UiInput } from '../../shared/ui';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatSnackBarModule,
    UiButton,
    UiFormField,
    UiInput,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  loading = false;

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  readonly demos = [
    { label: 'Taller', email: 'centro@auxilionorte.com', password: 'password123' },
    { label: 'Admin tenant', email: 'ana@auxilionorte.com', password: 'password123' },
    { label: 'Admin plataforma', email: 'admin@plataforma.com', password: 'password123' },
  ];

  fillDemo(email: string, password: string): void {
    this.form.patchValue({ email, password });
    this.snack.open('Credenciales demo cargadas', undefined, { duration: 2000 });
  }

  invalid(field: 'email' | 'password'): boolean {
    const c = this.form.controls[field];
    return c.touched && c.invalid;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading = true;
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate([defaultRouteForRole(this.auth.role)]);
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.detail ?? 'Credenciales inválidas';
        this.snack.open(msg, 'Cerrar', { duration: 4000 });
      },
    });
  }
}
