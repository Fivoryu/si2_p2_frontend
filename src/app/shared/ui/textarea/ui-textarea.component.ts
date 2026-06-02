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

@Component({
  selector: 'ui-textarea',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiTextarea),
      multi: true,
    },
  ],
  host: {
    class: 'ui-textarea-host',
    '[class.ui-textarea-host--invalid]': 'invalid()',
  },
  template: `
    <textarea
      class="ui-textarea"
      [class.ui-invalid]="invalid()"
      [placeholder]="placeholder()"
      [disabled]="isDisabled()"
      [readonly]="readonly()"
      [rows]="rows()"
      [attr.id]="inputId()"
      [attr.aria-invalid]="invalid()"
      [value]="value()"
      (input)="onInput($event)"
      (blur)="onBlur()"
    ></textarea>
  `,
  styleUrl: './ui-textarea.component.scss',
})
export class UiTextarea implements ControlValueAccessor {
  placeholder = input('');
  rows = input(4);
  inputId = input<string>();
  readonly = input(false, { transform: booleanAttribute });
  invalid = input(false, { transform: booleanAttribute });

  value = signal('');
  isDisabled = signal(false);

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
    const v = (event.target as HTMLTextAreaElement).value;
    this.value.set(v);
    this.onChange(v);
  }

  onBlur(): void {
    this.onTouched();
  }
}
