import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { TallerRow } from '../workshops/talleres.component';

export interface TecnicoRow {
  id: string;
  nombre: string;
  telefono?: string;
  taller_id: string;
  taller_nombre?: string;
  especialidad?: string;
  especialidades?: string[];
  especialidad_ids?: string[];
  disponible?: boolean;
  usuario_email?: string;
}

interface EspecialidadOption {
  id: string;
  nombre: string;
  activo?: boolean;
}

@Component({
  selector: 'app-tecnicos',
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
    MatCheckboxModule,
  ],
  templateUrl: './tecnicos.component.html',
  styleUrl: './tecnicos.component.scss',
})
export class TecnicosComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  tecnicos: TecnicoRow[] = [];
  talleres: TallerRow[] = [];
  especialidades: EspecialidadOption[] = [];
  loading = true;
  saving = false;
  editingId: string | null = null;
  isAdminTenant = false;

  createForm = this.fb.nonNullable.group({
    taller_id: ['', Validators.required],
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    telefono: [''],
    especialidad_ids: [[] as string[]],
  });

  editForm = this.fb.nonNullable.group({
    taller_id: ['', Validators.required],
    nombre: ['', Validators.required],
    email: ['', Validators.email],
    password: [''],
    telefono: [''],
    especialidad_ids: [[] as string[]],
    disponible: [true],
  });

  displayedColumns = [
    'nombre',
    'usuario_email',
    'telefono',
    'taller_nombre',
    'especialidad',
    'disponible',
    'acciones',
  ];

  ngOnInit(): void {
    this.isAdminTenant = this.auth.role === 'ADMIN_TENANT';
    this.loadTecnicos();
    this.loadTalleres();
  }

  loadTecnicos(): void {
    this.loading = true;
    this.api.get<{ items: TecnicoRow[] }>('/tecnicos?limit=200').subscribe({
      next: (r) => {
        this.tecnicos = r.items ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snack.open('Error al cargar técnicos', 'Cerrar', { duration: 4000 });
      },
    });
  }

  loadTalleres(): void {
    this.api.get<{ items: TallerRow[] }>('/talleres').subscribe({
      next: (r) => {
        this.talleres = (r.items ?? []).filter((t) => t.activo !== false);
        if (!this.isAdminTenant && this.talleres.length === 1) {
          this.createForm.patchValue({ taller_id: this.talleres[0].id });
        }
      },
      error: () => {},
    });
  }

  onTallerChange(tallerId: string, forEdit = false): void {
    if (!tallerId) {
      this.especialidades = [];
      return;
    }
    this.api
      .get<{ items: EspecialidadOption[] }>(`/talleres/${tallerId}/especialidades?activo=true`)
      .subscribe({
        next: (r) => {
          this.especialidades = r.items ?? [];
          if (!forEdit) {
            this.createForm.patchValue({ especialidad_ids: [] });
          }
        },
        error: () => (this.especialidades = []),
      });
  }

  createTecnico(): void {
    if (this.createForm.invalid) return;
    const raw = this.createForm.getRawValue();
    if (raw.password && raw.password.length < 8) {
      this.snack.open('La contraseña debe tener al menos 8 caracteres', 'Cerrar', { duration: 4000 });
      return;
    }
    this.saving = true;
    this.api
      .post<{ id: string; password_temporal?: string }>('/tecnicos', {
        taller_id: raw.taller_id,
        nombre: raw.nombre,
        email: raw.email,
        password: raw.password || null,
        telefono: raw.telefono || null,
        especialidad_ids: raw.especialidad_ids?.length ? raw.especialidad_ids : null,
      })
      .subscribe({
        next: (res) => {
          this.saving = false;
          this.createForm.patchValue({
            nombre: '',
            email: '',
            password: '',
            telefono: '',
            especialidad_ids: [],
          });
          this.loadTecnicos();
          const msg = res.password_temporal
            ? `Técnico registrado. Contraseña temporal: ${res.password_temporal}`
            : 'Técnico registrado';
          this.snack.open(msg, 'OK', { duration: 6000 });
        },
        error: (e) => {
          this.saving = false;
          this.snack.open(e?.error?.detail ?? 'Error al registrar', 'Cerrar', { duration: 4000 });
        },
      });
  }

  startEdit(row: TecnicoRow): void {
    this.editingId = row.id;
    this.editForm.patchValue({
      taller_id: row.taller_id,
      nombre: row.nombre,
      email: row.usuario_email ?? '',
      password: '',
      telefono: row.telefono ?? '',
      especialidad_ids: row.especialidad_ids ?? [],
      disponible: row.disponible ?? true,
    });
    this.onTallerChange(row.taller_id, true);
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(): void {
    if (!this.editingId || this.editForm.invalid) return;
    const raw = this.editForm.getRawValue();
    if (raw.password && raw.password.length < 8) {
      this.snack.open('La contraseña debe tener al menos 8 caracteres', 'Cerrar', { duration: 4000 });
      return;
    }
    this.saving = true;
    const body: Record<string, unknown> = {
      nombre: raw.nombre,
      telefono: raw.telefono || null,
      especialidad_ids: raw.especialidad_ids ?? [],
      disponible: raw.disponible,
    };
    if (raw.email) {
      body['email'] = raw.email;
    }
    if (raw.password) {
      body['password'] = raw.password;
    }
    if (this.isAdminTenant) {
      body['taller_id'] = raw.taller_id;
    }
    this.api.patch(`/tecnicos/${this.editingId}`, body).subscribe({
      next: () => {
        this.saving = false;
        this.editingId = null;
        this.loadTecnicos();
        this.snack.open('Técnico actualizado', 'OK', { duration: 2000 });
      },
      error: (e) => {
        this.saving = false;
        this.snack.open(e?.error?.detail ?? 'Error al actualizar', 'Cerrar', { duration: 4000 });
      },
    });
  }

  remove(row: TecnicoRow): void {
    if (!confirm(`¿Eliminar o desactivar al técnico «${row.nombre}»?`)) return;
    this.api.delete<{ desactivado?: boolean }>(`/tecnicos/${row.id}`).subscribe({
      next: (res) => {
        this.loadTecnicos();
        const msg = res?.desactivado
          ? 'Técnico desactivado (tiene asignaciones activas)'
          : 'Técnico eliminado';
        this.snack.open(msg, 'OK', { duration: 3000 });
      },
      error: (e) =>
        this.snack.open(e?.error?.detail ?? 'Error al eliminar', 'Cerrar', { duration: 4000 }),
    });
  }
}
