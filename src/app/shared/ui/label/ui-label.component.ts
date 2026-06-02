import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

@Component({
  selector: 'ui-label',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-label',
    '[class.ui-label--required]': 'required()',
    '[class.ui-label--disabled]': 'disabled()',
  },
  template: `
    <span class="ui-label__text"><ng-content /></span>
    @if (required()) {
      <span class="ui-label__asterisk" aria-hidden="true">*</span>
    }
    @if (hint()) {
      <span class="ui-label__hint">{{ hint() }}</span>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: var(--ui-space-xs) var(--ui-space-sm);
      margin-bottom: var(--ui-space-sm);
      font-family: var(--ui-font-family);
    }

    .ui-label__text {
      font-size: var(--ui-font-size-sm);
      font-weight: 600;
      color: var(--ui-color-text);
      line-height: 1.4;
    }

    :host.ui-label--disabled .ui-label__text {
      color: var(--ui-color-text-muted);
    }

    .ui-label__asterisk {
      color: var(--ui-color-danger);
      font-weight: 700;
    }

    .ui-label__hint {
      flex-basis: 100%;
      font-size: var(--ui-font-size-xs);
      font-weight: 400;
      color: var(--ui-color-text-muted);
    }
  `,
})
export class UiLabel {
  hint = input<string>();
  required = input(false, { transform: booleanAttribute });
  disabled = input(false, { transform: booleanAttribute });
}
