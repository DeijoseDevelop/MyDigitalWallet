import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

export const CATEGORY_EMOJIS: Record<string, string> = {
  'Comida': '🍔',
  'Transporte': '🚗',
  'Servicios': '⚡',
  'Compras': '🛍️',
  'Salud': '💊',
  'Ocio': '🎮',
  'Otro': '💸',
};

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  standalone: false,
})
export class CalendarComponent implements OnInit {

  @Input() selectedDate: Date | null = null;
  @Output() dateSelected = new EventEmitter<Date | null>();
  @Output() emojiSelected = new EventEmitter<string>();

  today = new Date();
  currentMonth!: Date;
  weeks: CalendarDay[][] = [];

  showEmojiPicker = false;
  selectedEmoji = '';
  selectedCategory = '';

  categories = Object.keys(CATEGORY_EMOJIS);

  readonly dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  readonly monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  ngOnInit() {
    this.currentMonth = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
    this.buildCalendar();
  }

  get monthLabel() {
    return `${this.monthNames[this.currentMonth.getMonth()]} ${this.currentMonth.getFullYear()}`;
  }

  prevMonth() {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() - 1, 1
    );
    this.buildCalendar();
  }

  nextMonth() {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1, 1
    );
    this.buildCalendar();
  }

  async selectDay(day: CalendarDay) {
    await Haptics.impact({ style: ImpactStyle.Light });
    if (this.selectedDate && this.sameDay(day.date, this.selectedDate)) {
      this.selectedDate = null;
      this.dateSelected.emit(null);
    } else {
      this.selectedDate = day.date;
      this.dateSelected.emit(day.date);
    }
    this.buildCalendar();
  }

  async selectCategory(cat: string) {
    await Haptics.impact({ style: ImpactStyle.Light });
    this.selectedCategory = this.selectedCategory === cat ? '' : cat;
    this.selectedEmoji = this.selectedCategory ? CATEGORY_EMOJIS[this.selectedCategory] : '';
    this.emojiSelected.emit(this.selectedCategory);
  }

  onEmojiPick(event: any) {
    const emoji = event.emoji?.native ?? '';
    this.selectedEmoji = emoji;
    this.showEmojiPicker = false;
    this.emojiSelected.emit(emoji);
  }

  async clearFilters() {
    await Haptics.impact({ style: ImpactStyle.Medium });
    this.selectedDate = null;
    this.selectedCategory = '';
    this.selectedEmoji = '';
    this.dateSelected.emit(null);
    this.emojiSelected.emit('');
    this.buildCalendar();
  }

  buildCalendar() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    const days: CalendarDay[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(this.makeDay(new Date(year, month - 1, daysInPrev - i), false));
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(this.makeDay(new Date(year, month, d), true));
    }
    while (days.length % 7 !== 0) {
      const next = days.length - firstDay - daysInMonth + 1;
      days.push(this.makeDay(new Date(year, month + 1, next), false));
    }

    this.weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      this.weeks.push(days.slice(i, i + 7));
    }
  }

  private makeDay(date: Date, isCurrentMonth: boolean): CalendarDay {
    return {
      date,
      isCurrentMonth,
      isToday: this.sameDay(date, this.today),
      isSelected: !!this.selectedDate && this.sameDay(date, this.selectedDate),
    };
  }

  private sameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  getCategoryEmoji(cat: string): string {
    return CATEGORY_EMOJIS[cat] ?? '💸';
  }
}