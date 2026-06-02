import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MarketingHeaderComponent } from '../../shared/marketing/marketing-header.component';
import {
  UiButton,
  UiFormField,
  UiInput,
  UiSelect,
  type UiSelectOption,
} from '../../shared/ui';
import { AuthService } from '../../core/auth.service';
import { PublicApiService, type SaasPlan } from '../../core/public-api.service';

type AccountType = 'conductor' | 'taller';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatSnackBarModule,
    MarketingHeaderComponent,
    UiButton,
    UiFormField,
    UiInput,
    UiSelect,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private publicApi = inject(PublicApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  accountType = signal<AccountType>('conductor');
  plans = signal<SaasPlan[]>([]);
  planOptions = signal<UiSelectOption[]>([]);
  loading = signal(false);

  conductorForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    telefono: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password2: ['', Validators.required],
  });

  tallerForm = this.fb.nonNullable.group({
    nombre_organizacion: ['', [Validators.required, Validators.minLength(2)]],
    dominio: [''],
    plan_id: ['', Validators.required],
    admin_nombre: ['', [Validators.required, Validators.minLength(2)]],
    admin_email: ['', [Validators.required, Validators.email]],
    admin_telefono: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password2: ['', Validators.required],
  });

  ngOnInit(): void {
    const tipo = this.route.snapshot.queryParamMap.get('tipo');
    if (tipo === 'taller') this.accountType.set('taller');
    const planId = this.route.snapshot.queryParamMap.get('plan');

    this.publicApi.getPlans().subscribe({
      next: (plans) => {
        this.plans.set(plans);
        this.planOptions.set(
          plans.map((p) => ({
            value: p.id,
            label: `${this.planLabel(p.nombre)} — ${this.formatBob(p.precio_mensual)}/mes`,
          }))
        );
        if (planId) {
          this.tallerForm.patchValue({ plan_id: planId });
        } else if (plans.length) {
          const pro = plans.find((p) => p.nombre === 'profesional');
          this.tallerForm.patchValue({ plan_id: pro?.id ?? plans[0].id });
        }
      },
    });
  }

  setType(type: AccountType): void {
    this.accountType.set(type);
  }

  invalidConductor(field: keyof typeof this.conductorForm.controls): boolean {
    const c = this.conductorForm.controls[field];
    return c.touched && c.invalid;
  }

  invalidTaller(field: keyof typeof this.tallerForm.controls): boolean {
    const c = this.tallerForm.controls[field];
    return c.touched && c.invalid;
  }

  formatBob(amount: number): string {
    if (amount <= 0) return 'Gratis';
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 0,
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

  submitConductor(): void {
    this.conductorForm.markAllAsTouched();
    if (this.conductorForm.invalid) return;
    const v = this.conductorForm.getRawValue();
    if (v.password !== v.password2) {
      this.snack.open('Las contraseñas no coinciden', 'Cerrar', { duration: 4000 });
      return;
    }
    this.loading.set(true);
    this.auth
      .registerConductor({
        nombre: v.nombre,
        email: v.email,
        telefono: v.telefono || undefined,
        password: v.password,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.snack.open('Cuenta creada. Ya puede iniciar sesión.', 'OK', { duration: 5000 });
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.loading.set(false);
          const msg = err?.error?.detail ?? 'No se pudo registrar';
          this.snack.open(typeof msg === 'string' ? msg : 'Error al registrar', 'Cerrar', {
            duration: 5000,
          });
        },
      });
  }

  submitTaller(): void {
    this.tallerForm.markAllAsTouched();
    if (this.tallerForm.invalid) return;
    const v = this.tallerForm.getRawValue();
    if (v.password !== v.password2) {
      this.snack.open('Las contraseñas no coinciden', 'Cerrar', { duration: 4000 });
      return;
    }
    this.loading.set(true);
    this.publicApi
      .signupTenant({
        nombre_organizacion: v.nombre_organizacion,
        dominio: v.dominio || undefined,
        plan_id: v.plan_id,
        admin_nombre: v.admin_nombre,
        admin_email: v.admin_email,
        admin_telefono: v.admin_telefono || undefined,
        password: v.password,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.snack.open(res.mensaje ?? 'Red creada correctamente', 'OK', { duration: 5000 });
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.loading.set(false);
          const msg = err?.error?.detail ?? 'No se pudo crear la red';
          this.snack.open(typeof msg === 'string' ? msg : 'Error al registrar', 'Cerrar', {
            duration: 5000,
          });
        },
      });
  }
}
