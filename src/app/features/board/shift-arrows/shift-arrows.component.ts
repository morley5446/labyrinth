import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShiftPosition } from '../../../core/models';

@Component({
  selector: 'app-shift-arrows',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shift-arrows.component.html',
})
export class ShiftArrowsComponent {
  @Input() lastShift: ShiftPosition | null = null;
  @Input() canShift = false;
  @Output() shift = new EventEmitter<ShiftPosition>();

  readonly shiftIndices = [1, 3, 5] as const;
  readonly allSlots = [0, 1, 2, 3, 4, 5, 6];

  isShiftable(index: number): boolean {
    return index === 1 || index === 3 || index === 5;
  }

  isBlocked(direction: string, index: number): boolean {
    if (!this.lastShift) return false;
    const reverse: Record<string, string> = { left: 'right', right: 'left', up: 'down', down: 'up' };
    return this.lastShift.index === index && reverse[this.lastShift.direction] === direction;
  }

  emit(direction: string, index: number): void {
    if (!this.canShift) return;
    if (!this.isBlocked(direction, index)) {
      this.shift.emit({ direction: direction as any, index: index as any });
    }
  }
}
