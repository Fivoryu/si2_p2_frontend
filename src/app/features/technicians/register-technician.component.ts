import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { UiButton, UiFormField, UiInput, UiSelect, type UiSelectOption } from '../../shared/ui';

interface TallerRow {
  id: string;
  nombre?: string;
  usuario_id?: string;
}

interface EspecialidadOption {
  id: string;
  nombre: string;
  activo?: boolean;
}

@Component({
  selector: 'app-register-technician',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatSnackBarModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
    UiButton,
    UiFormField,
    UiInput,
    UiSelect,
  ],
  templateUrl: './register-technician.component.html',
  styleUrl: './register-technician.component.scss',
})
export class RegisterTechnicianComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  loading = signal(false);
  loadingTalleres = signal(true);
  loadingEspecialidades = signal(false);
  tallerOptions = signal<UiSelectOption[]>([]);
  specialtyOptions = signal<EspecialidadOption[]>([]);
  selectedSpecialtyIds = signal<string[]>([]);
  createdId = signal<string | null>(null);
  isTallerRole = signal(false);

  form = this.fb.nonNullable.group({
    taller_id: ['', Validators.required],
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    telefono: [''],
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
          this.form.patchValue({ taller_id: items[0].id });
          this.loadSpecialties(items[0].id);
        }
        this.loadingTalleres.set(false);
      },
      error: () => this.loadingTalleres.set(false),
    });

    this.form.controls.taller_id.valueChanges.subscribe((tallerId) => {
      this.selectedSpecialtyIds.set([]);
      if (tallerId) {
        this.loadSpecialties(tallerId);
      } else {
        this.specialtyOptions.set([]);
      }
    });
  }

  loadSpecialties(tallerId: string): void {
    this.loadingEspecialidades.set(true);
    this.api
      .get<{ items: EspecialidadOption[] }>(`/talleres/${tallerId}/especialidades`, {
        activo: true,
      })
      .subscribe({
        next: (r) => {
          this.specialtyOptions.set(r.items ?? []);
          this.loadingEspecialidades.set(false);
        },
        error: () => {
          this.specialtyOptions.set([]);
          this.loadingEspecialidades.set(false);
        },
      });
  }

  isSpecialtySelected(id: string): boolean {
    return this.selectedSpecialtyIds().includes(id);
  }

  toggleSpecialty(id: string, checked: boolean): void {
    const current = this.selectedSpecialtyIds();
    if (checked) {
      this.selectedSpecialtyIds.set([...current, id]);
    } else {
      this.selectedSpecialtyIds.set(current.filter((x) => x !== id));
    }
  }

  invalid(field: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[field];
    return c.touched && c.invalid;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading.set(true);
    const raw = this.form.getRawValue();
    const espIds = this.selectedSpecialtyIds();
    this.api
      .post<{ id: string }>('/tecnicos', {
        taller_id: raw.taller_id,
        nombre: raw.nombre,
        telefono: raw.telefono || undefined,
        especialidad_ids: espIds.length ? espIds : undefined,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.createdId.set(res.id);
          this.form.reset();
          this.selectedSpecialtyIds.set([]);
          if (this.tallerOptions().length === 1) {
            this.form.patchValue({ taller_id: this.tallerOptions()[0].value });
          }
          this.snack.open('Técnico registrado correctamente', 'OK', { duration: 3000 });
        },
        error: (err) => {
          this.loading.set(false);
          const msg = err?.error?.detail ?? 'No se pudo registrar el técnico';
          this.snack.open(typeof msg === 'string' ? msg : 'Error al registrar', 'Cerrar', {
            duration: 5000,
          });
        },
      });
  }

  registerAnother(): void {
    this.createdId.set(null);
  }
}
