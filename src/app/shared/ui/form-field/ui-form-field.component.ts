import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  contentChild,
  input,
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { UiLabel } from '../label/ui-label.component';

@Component({
  selector: 'ui-form-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiLabel],
  host: {
    class: 'ui-form-field',
    '[class.ui-form-field--disabled]': 'disabled()',
  },
  template: `
    @if (label()) {
      <ui-label [required]="required()" [hint]="hint()" [disabled]="disabled()">
        {{ label() }}
      </ui-label>
    }
    <div class="ui-form-field__control">
      <ng-content />
    </div>
    @if (displayError()) {
      <p class="ui-form-field__error" role="alert">{{ displayError() }}</p>
    } @else if (helper()) {
      <p class="ui-form-field__helper">{{ helper() }}</p>
    }
  `,
  styles: `
    :host {
      display: block;
      margin-bottom: var(--ui-space-lg);
      font-family: var(--ui-font-family);
    }

    .ui-form-field__control {
      display: block;
    }

    .ui-form-field__error {
      margin: var(--ui-space-xs) 0 0;
      font-size: var(--ui-font-size-xs);
      color: var(--ui-color-danger);
    }

    .ui-form-field__helper {
      margin: var(--ui-space-xs) 0 0;
      font-size: var(--ui-font-size-xs);
      color: var(--ui-color-text-muted);
    }
  `,
})
export class UiFormField {
  label = input<string>();
  hint = input<string>();
  helper = input<string>();
  error = input<string>();
  required = input(false, { transform: booleanAttribute });
  disabled = input(false, { transform: booleanAttribute });

  private control = contentChild(NgControl, { descendants: true });

  displayError(): string | null {
    const manual = this.error();
    if (manual) return manual;
    const c = this.control();
    if (!c || !c.touched || !c.invalid) return null;
    const errs = c.errors;
    if (!errs) return null;
    if (errs['required']) return 'Este campo es obligatorio';
    if (errs['email']) return 'Ingrese un email válido';
    if (errs['minlength']) return `Mínimo ${errs['minlength'].requiredLength} caracteres`;
    if (errs['maxlength']) return `Máximo ${errs['maxlength'].requiredLength} caracteres`;
    if (errs['min']) return `El valor mínimo es ${errs['min'].min}`;
    if (errs['max']) return `El valor máximo es ${errs['max'].max}`;
    return 'Valor inválido';
  }
}
