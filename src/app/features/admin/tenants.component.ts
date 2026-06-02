import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService } from '../../core/api.service';

export interface TenantRow {
  id: string;
  nombre: string;
  dominio?: string;
  plan_id?: string;
}

interface PlanOption {
  id: string;
  nombre?: string;
}

@Component({
  selector: 'app-tenants',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTabsModule,
  ],
  templateUrl: './tenants.component.html',
  styleUrl: './tenants.component.scss',
})
export class TenantsComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  tenants: TenantRow[] = [];
  plans: PlanOption[] = [];
  loading = true;
  selectedTenantId = '';

  createForm = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    dominio: ['', Validators.required],
    plan_id: ['', Validators.required],
  });

  adminForm = this.fb.nonNullable.group({
    tenant_id: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    nombre: [''],
  });

  planForm = this.fb.nonNullable.group({
    tenant_id: ['', Validators.required],
    plan_id: ['', Validators.required],
  });

  displayedColumns = ['nombre', 'dominio', 'plan_id'];

  ngOnInit(): void {
    this.loadTenants();
    this.api.get<{ items: PlanOption[] }>('/planes').subscribe({
      next: (r) => (this.plans = r.items ?? []),
      error: () => {},
    });
  }

  loadTenants(): void {
    this.loading = true;
    this.api.get<{ items: TenantRow[] }>('/tenants').subscribe({
      next: (r) => {
        this.tenants = r.items ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  createTenant(): void {
    if (this.createForm.invalid) return;
    this.api.post('/tenants', this.createForm.getRawValue()).subscribe({
      next: () => {
        this.createForm.reset();
        this.loadTenants();
        this.snack.open('Tenant creado', 'OK', { duration: 2000 });
      },
      error: (e) =>
        this.snack.open(e?.error?.detail ?? 'Error al crear tenant', 'Cerrar', { duration: 4000 }),
    });
  }

  assignAdmin(): void {
    if (this.adminForm.invalid) return;
    const { tenant_id, email, nombre } = this.adminForm.getRawValue();
    this.api.post(`/tenants/${tenant_id}/admin`, { email, nombre }).subscribe({
      next: () => {
        this.snack.open('Admin asignado', 'OK', { duration: 2000 });
        this.adminForm.patchValue({ email: '', nombre: '' });
      },
      error: (e) =>
        this.snack.open(e?.error?.detail ?? 'Error al asignar admin', 'Cerrar', { duration: 4000 }),
    });
  }

  changePlan(): void {
    if (this.planForm.invalid) return;
    const { tenant_id, plan_id } = this.planForm.getRawValue();
    this.api.patch(`/tenants/${tenant_id}/plan`, { plan_id }).subscribe({
      next: () => {
        this.loadTenants();
        this.snack.open('Plan actualizado', 'OK', { duration: 2000 });
      },
      error: (e) =>
        this.snack.open(e?.error?.detail ?? 'Error al cambiar plan', 'Cerrar', { duration: 4000 }),
    });
  }
}
