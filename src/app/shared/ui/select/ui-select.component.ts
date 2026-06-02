import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import type { UiFieldSize } from '../ui.types';

export interface UiSelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'ui-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiSelect),
      multi: true,
    },
  ],
  host: {
    class: 'ui-select-host',
    '[class.ui-select-host--invalid]': 'invalid()',
    '[class.ui-select-host--disabled]': 'isDisabled()',
  },
  template: `
    <div class="ui-select-wrap" [class]="sizeClass()">
      <select
        class="ui-select"
        [class.ui-invalid]="invalid()"
        [disabled]="isDisabled()"
        [attr.id]="inputId()"
        [attr.aria-invalid]="invalid()"
        [value]="value()"
        (change)="onChangeSelect($event)"
        (blur)="onBlur()"
      >
        @if (placeholder()) {
          <option value="" disabled>{{ placeholder() }}</option>
        }
        @for (opt of options(); track opt.value) {
          <option [value]="opt.value" [disabled]="opt.disabled ?? false">
            {{ opt.label }}
          </option>
        }
      </select>
      <span class="ui-select__chevron" aria-hidden="true"></span>
    </div>
  `,
  styleUrl: './ui-select.component.scss',
})
export class UiSelect implements ControlValueAccessor {
  options = input<UiSelectOption[]>([]);
  size = input<UiFieldSize>('md');
  placeholder = input('Seleccionar…');
  inputId = input<string>();
  invalid = input(false, { transform: booleanAttribute });

  value = signal('');
  isDisabled = signal(false);

  sizeClass = () => `ui-select-wrap--${this.size()}`;

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: string | null): void {
    this.value.set(v ?? '');
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.isDisabled.set(disabled);
  }

  onChangeSelect(event: Event): void {
    const v = (event.target as HTMLSelectElement).value;
    this.value.set(v);
    this.onChange(v);
  }

  onBlur(): void {
    this.onTouched();
  }
}
