import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
  output,
} from '@angular/core';
import type { UiButtonSize, UiButtonVariant } from '../ui.types';

@Component({
  selector: 'ui-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-btn-host',
    '[class.ui-btn-host--block]': 'block()',
    '[class.ui-btn-host--on-dark]': 'onDark()',
  },
  template: `
    <button
      [attr.type]="type()"
      class="ui-btn"
      [class]="buttonClasses()"
      [disabled]="isDisabled()"
      [attr.aria-busy]="loading()"
      [attr.aria-disabled]="isDisabled()"
      (click)="onClick($event)"
    >
      @if (loading()) {
        <span class="ui-btn__spinner" aria-hidden="true"></span>
      }
      <span class="ui-btn__content" [class.ui-btn__content--hidden]="loading()">
        <ng-content />
      </span>
    </button>
  `,
  styles: `
    :host {
      display: inline-block;
    }

    :host.ui-btn-host--block {
      display: block;
      width: 100%;
    }

    :host.ui-btn-host--block .ui-btn {
      width: 100%;
    }

    .ui-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--ui-space-sm);
      border: 1px solid transparent;
      border-radius: var(--ui-radius-md);
      font-family: var(--ui-font-family);
      font-weight: 600;
      cursor: pointer;
      transition: background var(--ui-transition), border-color var(--ui-transition),
        color var(--ui-transition), box-shadow var(--ui-transition);
      position: relative;
    }

    .ui-btn:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }

    .ui-btn--sm {
      min-height: var(--ui-control-height-sm);
      padding: 0 var(--ui-space-lg);
      font-size: var(--ui-font-size-sm);
    }

    .ui-btn--md {
      min-height: var(--ui-control-height-md);
      padding: 0 var(--ui-space-xl);
      font-size: var(--ui-font-size-md);
    }

    .ui-btn--lg {
      min-height: var(--ui-control-height-lg);
      padding: 0 28px;
      font-size: var(--ui-font-size-lg);
    }

    .ui-btn--primary {
      background: var(--ui-color-primary);
      color: var(--ui-color-text-inverse);
      box-shadow: var(--ui-shadow-sm);
    }

    .ui-btn--primary:hover:not(:disabled) {
      background: var(--ui-color-primary-hover);
    }

    .ui-btn--secondary {
      background: var(--ui-color-secondary);
      color: var(--ui-color-text-inverse);
    }

    .ui-btn--secondary:hover:not(:disabled) {
      background: var(--ui-color-secondary-hover);
    }

    .ui-btn--outline {
      background: transparent;
      border-color: var(--ui-color-border);
      color: var(--ui-color-text);
    }

    .ui-btn--outline:hover:not(:disabled) {
      border-color: var(--ui-color-primary);
      color: var(--ui-color-primary);
      background: var(--ui-color-primary-soft);
    }

    .ui-btn--ghost {
      background: transparent;
      color: var(--ui-color-text);
    }

    .ui-btn--ghost:hover:not(:disabled) {
      background: var(--ui-color-background);
    }

    .ui-btn--danger {
      background: var(--ui-color-danger);
      color: var(--ui-color-text-inverse);
    }

    .ui-btn--danger:hover:not(:disabled) {
      background: #b91c1c;
    }

    :host.ui-btn-host--on-dark .ui-btn--outline {
      border-color: rgba(255, 255, 255, 0.45);
      color: #f8fafc;
      background: rgba(255, 255, 255, 0.06);
    }

    :host.ui-btn-host--on-dark .ui-btn--outline:hover:not(:disabled) {
      border-color: var(--ui-color-primary);
      color: #fff;
      background: rgba(249, 115, 22, 0.15);
    }

    :host.ui-btn-host--on-dark .ui-btn--ghost {
      color: #e2e8f0;
    }

    :host.ui-btn-host--on-dark .ui-btn--ghost:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .ui-btn__spinner {
      width: 18px;
      height: 18px;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: ui-spin 0.65s linear infinite;
    }

    .ui-btn__content--hidden {
      visibility: hidden;
      position: absolute;
    }

    @keyframes ui-spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class UiButton {
  variant = input<UiButtonVariant>('primary');
  size = input<UiButtonSize>('md');
  type = input<'button' | 'submit' | 'reset'>('button');
  disabled = input(false, { transform: booleanAttribute });
  loading = input(false, { transform: booleanAttribute });
  block = input(false, { transform: booleanAttribute });
  /** Estilos legibles sobre fondos oscuros (marketing). */
  onDark = input(false, { transform: booleanAttribute });

  clicked = output<MouseEvent>();

  isDisabled = () => this.disabled() || this.loading();

  buttonClasses = () =>
    `ui-btn ui-btn--${this.variant()} ui-btn--${this.size()}`;

  onClick(event: MouseEvent): void {
    if (this.isDisabled()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.clicked.emit(event);
  }
}
