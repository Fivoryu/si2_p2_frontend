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
  selector: 'ui-checkbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiCheckbox),
      multi: true,
    },
  ],
  host: {
    class: 'ui-checkbox-host',
    '[class.ui-checkbox-host--disabled]': 'isDisabled()',
    '(click)': 'toggle($event)',
    '(keydown.enter)': 'toggle($event)',
    '(keydown.space)': 'toggle($event); $event.preventDefault()',
    role: 'checkbox',
    '[attr.aria-checked]': 'value()',
    '[attr.aria-disabled]': 'isDisabled()',
    tabindex: '0',
  },
  template: `
    <span class="ui-checkbox__box" [class.ui-checkbox__box--checked]="value()">
      @if (value()) {
        <span class="ui-checkbox__check" aria-hidden="true"></span>
      }
    </span>
    <span class="ui-checkbox__label"><ng-content /></span>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: flex-start;
      gap: var(--ui-space-md);
      cursor: pointer;
      font-family: var(--ui-font-family);
      font-size: var(--ui-font-size-sm);
      color: var(--ui-color-text);
      user-select: none;
    }

    :host.ui-checkbox-host--disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .ui-checkbox__box {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      border: 2px solid var(--ui-color-border);
      border-radius: var(--ui-radius-sm);
      background: var(--ui-color-surface);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color var(--ui-transition), background var(--ui-transition);
    }

    .ui-checkbox__box--checked {
      background: var(--ui-color-primary);
      border-color: var(--ui-color-primary);
    }

    .ui-checkbox__check {
      width: 6px;
      height: 10px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg) translateY(-1px);
    }

    :host:focus-visible .ui-checkbox__box {
      box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.25);
    }

    .ui-checkbox__label {
      line-height: 1.4;
      padding-top: 1px;
    }
  `,
})
export class UiCheckbox implements ControlValueAccessor {
  invalid = input(false, { transform: booleanAttribute });

  value = signal(false);
  isDisabled = signal(false);

  private onChange: (v: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: boolean | null): void {
    this.value.set(!!v);
  }

  registerOnChange(fn: (v: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.isDisabled.set(disabled);
  }

  toggle(event: Event): void {
    if (this.isDisabled()) return;
    event.preventDefault();
    const next = !this.value();
    this.value.set(next);
    this.onChange(next);
    this.onTouched();
  }
}
