import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService } from '../../core/api.service';

export interface TallerRow {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  latitud?: number;
  longitud?: number;
  disponible?: boolean;
  capacidad_max?: number;
  calificacion?: number;
  activo?: boolean;
  usuario_email?: string;
  usuario_nombre?: string;
}

@Component({
  selector: 'app-talleres',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTabsModule,
    MatCheckboxModule,
  ],
  templateUrl: './talleres.component.html',
  styleUrl: './talleres.component.scss',
})
export class TalleresComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  talleres: TallerRow[] = [];
  loading = true;
  saving = false;
  editingId: string | null = null;

  createForm = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    direccion: [''],
    telefono: [''],
    latitud: ['-17.7833'],
    longitud: ['-63.1821'],
    capacidad_max: ['3', Validators.required],
  });

  editForm = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    direccion: [''],
    telefono: [''],
    latitud: [''],
    longitud: [''],
    capacidad_max: ['3'],
    disponible: [true],
    activo: [true],
  });

  displayedColumns = [
    'nombre',
    'direccion',
    'telefono',
    'disponible',
    'capacidad_max',
    'calificacion',
    'activo',
    'usuario_email',
    'acciones',
  ];

  ngOnInit(): void {
    this.loadTalleres();
  }

  loadTalleres(): void {
    this.loading = true;
    this.api.get<{ items: TallerRow[] }>('/talleres').subscribe({
      next: (r) => {
        this.talleres = r.items ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snack.open('Error al cargar talleres', 'Cerrar', { duration: 4000 });
      },
    });
  }

  createTaller(): void {
    if (this.createForm.invalid) return;
    const raw = this.createForm.getRawValue();
    this.saving = true;
    this.api
      .post<{ id: string; password_temporal?: string }>('/talleres', {
        nombre: raw.nombre,
        email: raw.email,
        direccion: raw.direccion || null,
        telefono: raw.telefono || null,
        latitud: Number(raw.latitud) || -17.7833,
        longitud: Number(raw.longitud) || -63.1821,
        capacidad_max: Number(raw.capacidad_max) || 3,
      })
      .subscribe({
        next: (res) => {
          this.saving = false;
          this.createForm.reset({
            latitud: '-17.7833',
            longitud: '-63.1821',
            capacidad_max: '3',
          });
          this.loadTalleres();
          const msg = res.password_temporal
            ? `Taller creado. Contraseña temporal: ${res.password_temporal}`
            : 'Taller creado';
          this.snack.open(msg, 'OK', { duration: 6000 });
        },
        error: (e) => {
          this.saving = false;
          this.snack.open(e?.error?.detail ?? 'Error al crear taller', 'Cerrar', { duration: 4000 });
        },
      });
  }

  startEdit(row: TallerRow): void {
    this.editingId = row.id;
    this.editForm.patchValue({
      nombre: row.nombre,
      direccion: row.direccion ?? '',
      telefono: row.telefono ?? '',
      latitud: String(row.latitud ?? ''),
      longitud: String(row.longitud ?? ''),
      capacidad_max: String(row.capacidad_max ?? 3),
      disponible: row.disponible ?? true,
      activo: row.activo ?? true,
    });
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(): void {
    if (!this.editingId || this.editForm.invalid) return;
    const raw = this.editForm.getRawValue();
    this.saving = true;
    this.api
      .patch(`/talleres/${this.editingId}`, {
        nombre: raw.nombre,
        direccion: raw.direccion || null,
        telefono: raw.telefono || null,
        latitud: Number(raw.latitud) || undefined,
        longitud: Number(raw.longitud) || undefined,
        capacidad_max: Number(raw.capacidad_max) || 3,
        disponible: raw.disponible,
        activo: raw.activo,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.editingId = null;
          this.loadTalleres();
          this.snack.open('Taller actualizado', 'OK', { duration: 2000 });
        },
        error: (e) => {
          this.saving = false;
          this.snack.open(e?.error?.detail ?? 'Error al actualizar', 'Cerrar', { duration: 4000 });
        },
      });
  }

  deactivate(row: TallerRow): void {
    if (!confirm(`¿Desactivar el taller «${row.nombre}»?`)) return;
    this.api.delete(`/talleres/${row.id}`).subscribe({
      next: () => {
        this.loadTalleres();
        this.snack.open('Taller desactivado', 'OK', { duration: 2000 });
      },
      error: (e) =>
        this.snack.open(e?.error?.detail ?? 'Error al desactivar', 'Cerrar', { duration: 4000 }),
    });
  }
}
