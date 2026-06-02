import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/api.service';
import { UiButton, UiFormField, UiInput } from '../../shared/ui';

interface TallerCreateResponse {
  id: string;
  usuario_id: string;
}

@Component({
  selector: 'app-register-workshop',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatSnackBarModule,
    MatIconModule,
    UiButton,
    UiFormField,
    UiInput,
  ],
  templateUrl: './register-workshop.component.html',
  styleUrl: './register-workshop.component.scss',
})
export class RegisterWorkshopComponent {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  loading = signal(false);
  created = signal<{ id: string; email: string } | null>(null);

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    direccion: ['', Validators.required],
    latitud: [''],
    longitud: [''],
    telefono: [''],
    email: ['', [Validators.required, Validators.email]],
    capacidad_max: ['3', [Validators.required, Validators.pattern(/^[1-9]\d*$/)]],
  });

  invalid(field: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[field];
    return c.touched && c.invalid;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading.set(true);
    const raw = this.form.getRawValue();
    const body = {
      nombre: raw.nombre,
      direccion: raw.direccion,
      telefono: raw.telefono || undefined,
      email: raw.email,
      capacidad_max: Number(raw.capacidad_max) || 3,
      latitud: raw.latitud ? Number(raw.latitud) : undefined,
      longitud: raw.longitud ? Number(raw.longitud) : undefined,
    };
    this.api.post<TallerCreateResponse>('/talleres', body).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.created.set({ id: res.id, email: raw.email });
        this.form.reset({ capacidad_max: '3' });
        this.snack.open('Taller registrado correctamente', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.detail ?? 'No se pudo registrar el taller';
        this.snack.open(typeof msg === 'string' ? msg : 'Error al registrar', 'Cerrar', {
          duration: 5000,
        });
      },
    });
  }

  registerAnother(): void {
    this.created.set(null);
  }
}
