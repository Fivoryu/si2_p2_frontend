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

@Component({
  selector: 'ui-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiInput),
      multi: true,
    },
  ],
  host: {
    class: 'ui-input-host',
    '[class.ui-input-host--invalid]': 'invalid()',
    '[class.ui-input-host--disabled]': 'isDisabled()',
  },
  template: `
    <input
      class="ui-input"
      [class]="sizeClass()"
      [class.ui-invalid]="invalid()"
      [type]="type()"
      [placeholder]="placeholder()"
      [disabled]="isDisabled()"
      [readonly]="readonly()"
      [attr.id]="inputId()"
      [attr.name]="name()"
      [attr.autocomplete]="autocomplete()"
      [attr.aria-invalid]="invalid()"
      [value]="value()"
      (input)="onInput($event)"
      (blur)="onBlur()"
    />
  `,
  styleUrl: './ui-input.component.scss',
})
export class UiInput implements ControlValueAccessor {
  type = input<'text' | 'email' | 'password' | 'number' | 'tel' | 'search'>('text');
  size = input<UiFieldSize>('md');
  placeholder = input('');
  inputId = input<string>();
  name = input<string>();
  autocomplete = input<string>();
  readonly = input(false, { transform: booleanAttribute });
  invalid = input(false, { transform: booleanAttribute });

  value = signal('');
  isDisabled = signal(false);

  sizeClass = () => `ui-input--${this.size()}`;

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

  onInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.value.set(v);
    this.onChange(v);
  }

  onBlur(): void {
    this.onTouched();
  }
}
