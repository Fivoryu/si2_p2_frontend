import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/api.service';

interface TallerInfo {
  id: string;
  nombre?: string;
  disponible?: boolean;
  capacidad_max?: number;
}

@Component({
  selector: 'app-availability',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
  ],
  templateUrl: './availability.component.html',
  styleUrl: './availability.component.scss',
})
export class AvailabilityComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  taller = signal<TallerInfo | undefined>(undefined);
  loading = signal(true);
  saving = signal(false);

  form = this.fb.nonNullable.group({
    disponible: [true],
    capacidad_max: ['5'],
  });

  ngOnInit(): void {
    this.api.get<TallerInfo>('/talleres/yo').subscribe({
      next: (t) => {
        this.taller.set(t);
        if (t) {
          this.form.patchValue({
            disponible: t.disponible ?? true,
            capacidad_max: String(t.capacidad_max ?? 5),
          });
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  save(): void {
    const t = this.taller();
    if (!t?.id) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const body = {
      disponible: raw.disponible,
      capacidad_max: Number(raw.capacidad_max) || 1,
    };
    this.api.patch(`/talleres/${t.id}/disponibilidad`, body).subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open('Disponibilidad actualizada', 'OK', { duration: 2000 });
      },
      error: (e) => {
        this.saving.set(false);
        this.snack.open(e?.error?.detail ?? 'Error al guardar', 'Cerrar', { duration: 4000 });
      },
    });
  }
}
