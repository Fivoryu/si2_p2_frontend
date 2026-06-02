import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  UiButton,
  UiCalendar,
  UiCheckbox,
  UiFormField,
  UiInput,
  UiSelect,
  UiTextarea,
  type UiSelectOption,
} from '../../shared/ui';

@Component({
  selector: 'app-design-system',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    UiButton,
    UiFormField,
    UiInput,
    UiSelect,
    UiTextarea,
    UiCheckbox,
    UiCalendar,
  ],
  templateUrl: './design-system.component.html',
  styleUrl: './design-system.component.scss',
})
export class DesignSystemComponent {
  private fb = inject(FormBuilder);

  readonly serviceOptions: UiSelectOption[] = [
    { value: 'grua', label: 'Grúa / remolque' },
    { value: 'bateria', label: 'Batería descargada' },
    { value: 'llanta', label: 'Cambio de llanta' },
    { value: 'mecanica', label: 'Falla mecánica' },
  ];

  demoForm = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    servicio: ['', Validators.required],
    fecha: ['', Validators.required],
    notas: [''],
    urgente: [false],
  });

  submitted = false;

  submit(): void {
    this.demoForm.markAllAsTouched();
    if (this.demoForm.invalid) return;
    this.submitted = true;
  }

  reset(): void {
    this.demoForm.reset({
      nombre: '',
      email: '',
      servicio: '',
      fecha: '',
      notas: '',
      urgente: false,
    });
    this.submitted = false;
  }

  invalid(controlName: keyof typeof this.demoForm.controls): boolean {
    const c = this.demoForm.controls[controlName];
    return c.touched && c.invalid;
  }
}
