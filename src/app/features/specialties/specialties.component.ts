import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { UiFormField, UiSelect, type UiSelectOption } from '../../shared/ui';

interface TallerRow {
  id: string;
  nombre?: string;
  usuario_id?: string;
}

interface EspecialidadRow {
  id: string;
  nombre: string;
  activo?: boolean;
}

@Component({
  selector: 'app-specialties',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTableModule,
    MatButtonModule,
    UiFormField,
    UiSelect,
  ],
  templateUrl: './specialties.component.html',
  styleUrl: './specialties.component.scss',
})
export class SpecialtiesComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  loading = signal(true);
  isTallerRole = signal(false);
  tallerOptions = signal<UiSelectOption[]>([]);
  selectedTallerId = signal('');
  rows = signal<EspecialidadRow[]>([]);

  displayedColumns = ['nombre', 'activo', 'acciones'];

  tallerForm = this.fb.nonNullable.group({
    taller_id: ['', Validators.required],
  });

  ngOnInit(): void {
    this.isTallerRole.set(this.auth.role === 'TALLER');
    this.api.get<{ items: TallerRow[] }>('/talleres').subscribe({
      next: (r) => {
        let items = r.items ?? [];
        if (this.isTallerRole() && this.auth.userId) {
          const own = items.filter((t) => t.usuario_id === this.auth.userId);
          if (own.length) items = own;
        }
        this.tallerOptions.set(
          items.map((t) => ({ value: t.id, label: t.nombre ?? t.id }))
        );
        if (items.length === 1) {
          this.selectedTallerId.set(items[0].id);
          this.tallerForm.patchValue({ taller_id: items[0].id });
          this.loadSpecialties(items[0].id);
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });

    this.tallerForm.controls.taller_id.valueChanges.subscribe((id) => {
      this.onTallerChange(id);
    });
  }

  onTallerChange(tallerId: string): void {
    this.selectedTallerId.set(tallerId);
    if (tallerId) {
      this.loadSpecialties(tallerId);
    } else {
      this.rows.set([]);
    }
  }

  loadSpecialties(tallerId: string): void {
    this.loading.set(true);
    this.api.get<{ items: EspecialidadRow[] }>(`/talleres/${tallerId}/especialidades`).subscribe({
      next: (r) => {
        this.rows.set(r.items ?? []);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.snack.open(e?.error?.detail ?? 'Error al cargar especialidades', 'Cerrar', {
          duration: 4000,
        });
      },
    });
  }

  toggleActivo(row: EspecialidadRow): void {
    const tallerId = this.selectedTallerId();
    if (!tallerId) return;
    this.api
      .patch(`/talleres/${tallerId}/especialidades/${row.id}`, { activo: !row.activo })
      .subscribe({
        next: () => this.loadSpecialties(tallerId),
        error: (e) =>
          this.snack.open(e?.error?.detail ?? 'Error al cambiar estado', 'Cerrar', {
            duration: 4000,
          }),
      });
  }
}
