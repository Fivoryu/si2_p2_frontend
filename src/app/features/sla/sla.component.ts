import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/api.service';

export interface SlaRow {
  id?: string;
  tipo_incidente_id: string;
  tipo_nombre?: string;
  tiempo_max_min: number;
}

@Component({
  selector: 'app-sla',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './sla.component.html',
  styleUrl: './sla.component.scss',
})
export class SlaComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  rows: SlaRow[] = [];
  loading = true;
  editingId: string | null = null;
  editValue = 0;

  displayedColumns = ['tipo', 'tiempo_max_min', 'acciones'];

  newForm = this.fb.nonNullable.group({
    tipo_incidente_id: ['', Validators.required],
    tiempo_max_min: [60, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.get<SlaRow[] | { items: SlaRow[] }>('/sla').subscribe({
      next: (r) => {
        this.rows = Array.isArray(r) ? r : (r.items ?? []);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  startEdit(row: SlaRow): void {
    this.editingId = row.id ?? row.tipo_incidente_id;
    this.editValue = row.tiempo_max_min;
  }

  saveEdit(row: SlaRow): void {
    const id = row.id;
    if (!id) return;
    this.api.patch(`/sla/${id}`, { tiempo_max_min: this.editValue }).subscribe({
      next: () => {
        row.tiempo_max_min = this.editValue;
        this.editingId = null;
        this.snack.open('SLA actualizado', 'OK', { duration: 2000 });
      },
      error: (e) =>
        this.snack.open(e?.error?.detail ?? 'Error', 'Cerrar', { duration: 4000 }),
    });
  }

  create(): void {
    if (this.newForm.invalid) return;
    this.api.post('/sla', this.newForm.getRawValue()).subscribe({
      next: () => {
        this.newForm.reset({ tipo_incidente_id: '', tiempo_max_min: 60 });
        this.load();
        this.snack.open('SLA creado', 'OK', { duration: 2000 });
      },
      error: (e) =>
        this.snack.open(e?.error?.detail ?? 'Error al crear', 'Cerrar', { duration: 4000 }),
    });
  }
}
