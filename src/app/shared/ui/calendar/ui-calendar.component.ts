import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
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
  selector: 'ui-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiCalendar),
      multi: true,
    },
  ],
  host: {
    class: 'ui-calendar-host',
    '[class.ui-calendar-host--open]': 'open()',
    '[class.ui-calendar-host--invalid]': 'invalid()',
  },
  template: `
    <div class="ui-calendar" [class]="sizeClass()">
      <input
        class="ui-calendar__input"
        type="text"
        readonly
        [placeholder]="placeholder()"
        [disabled]="isDisabled()"
        [value]="displayValue()"
        [attr.aria-expanded]="open()"
        [attr.aria-invalid]="invalid()"
        (click)="toggle()"
        (keydown.enter)="toggle()"
        (blur)="onInputBlur()"
      />
      <button
        type="button"
        class="ui-calendar__trigger"
        [disabled]="isDisabled()"
        aria-label="Abrir calendario"
        (click)="toggle()"
      >
        <span class="ui-calendar__icon" aria-hidden="true"></span>
      </button>
      @if (open()) {
        <div class="ui-calendar__panel" role="dialog" aria-label="Calendario">
          <div class="ui-calendar__header">
            <button type="button" class="ui-calendar__nav" (click)="prevMonth()">‹</button>
            <span class="ui-calendar__title">{{ monthLabel() }}</span>
            <button type="button" class="ui-calendar__nav" (click)="nextMonth()">›</button>
          </div>
          <div class="ui-calendar__weekdays">
            @for (d of weekdays; track d) {
              <span>{{ d }}</span>
            }
          </div>
          <div class="ui-calendar__grid">
            @for (cell of cells(); track cell.key) {
              <button
                type="button"
                class="ui-calendar__day"
                [class.ui-calendar__day--muted]="!cell.inMonth"
                [class.ui-calendar__day--selected]="cell.selected"
                [class.ui-calendar__day--today]="cell.today"
                [disabled]="!cell.inMonth"
                (mousedown)="selectDate(cell.iso); $event.preventDefault()"
              >
                {{ cell.day }}
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './ui-calendar.component.scss',
})
export class UiCalendar implements ControlValueAccessor {
  size = input<UiFieldSize>('md');
  placeholder = input('Seleccionar fecha');
  invalid = input(false, { transform: booleanAttribute });
  min = input<string>();
  max = input<string>();

  readonly weekdays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

  value = signal<string>('');
  viewMonth = signal(new Date());
  open = signal(false);
  isDisabled = signal(false);

  sizeClass = () => `ui-calendar--${this.size()}`;

  displayValue = computed(() => {
    const iso = this.value();
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return iso;
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  });

  monthLabel = computed(() => {
    const v = this.viewMonth();
    return v.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' });
  });

  cells = computed(() => {
    const view = this.viewMonth();
    const year = view.getFullYear();
    const month = view.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - startOffset);
    const selected = this.value();
    const todayIso = this.toIso(new Date());
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const iso = this.toIso(d);
      cells.push({
        key: iso,
        day: d.getDate(),
        iso,
        inMonth: d.getMonth() === month,
        selected: iso === selected,
        today: iso === todayIso,
      });
    }
    return cells;
  });

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: string | null): void {
    this.value.set(v ?? '');
    if (v) {
      const [y, m] = v.split('-').map(Number);
      if (y && m) this.viewMonth.set(new Date(y, m - 1, 1));
    }
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

  toggle(): void {
    if (this.isDisabled()) return;
    this.open.update((o) => !o);
  }

  onInputBlur(): void {
    setTimeout(() => {
      if (this.open()) return;
      this.onTouched();
    }, 150);
  }

  prevMonth(): void {
    const v = this.viewMonth();
    this.viewMonth.set(new Date(v.getFullYear(), v.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const v = this.viewMonth();
    this.viewMonth.set(new Date(v.getFullYear(), v.getMonth() + 1, 1));
  }

  selectDate(iso: string): void {
    this.value.set(iso);
    this.onChange(iso);
    this.onTouched();
    this.open.set(false);
  }

  private toIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
