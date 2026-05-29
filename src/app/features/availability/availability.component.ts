import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './availability.component.html',
  styleUrl: './availability.component.scss',
})
export class AvailabilityComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  taller?: TallerInfo;
  loading = true;
  saving = false;

  form = this.fb.nonNullable.group({
    disponible: [true],
    capacidad_max: [5],
  });

  ngOnInit(): void {
    this.api.get<{ items: TallerInfo[] }>('/talleres').subscribe({
      next: (r) => {
        this.taller = r.items?.[0];
        if (this.taller) {
          this.form.patchValue({
            disponible: this.taller.disponible ?? true,
            capacidad_max: this.taller.capacidad_max ?? 5,
          });
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  save(): void {
    if (!this.taller?.id) return;
    this.saving = true;
    const body = this.form.getRawValue();
    this.api.patch(`/talleres/${this.taller.id}/disponibilidad`, body).subscribe({
      next: () => {
        this.saving = false;
        this.snack.open('Disponibilidad actualizada', 'OK', { duration: 2000 });
      },
      error: (e) => {
        this.saving = false;
        this.snack.open(e?.error?.detail ?? 'Error al guardar', 'Cerrar', { duration: 4000 });
      },
    });
  }
}
