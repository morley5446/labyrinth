import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShiftPosition, Tile } from '../../../core/models';

type ShiftDir = 'left' | 'right' | 'up' | 'down';

interface TilePreview {
  tile: Tile;
  dir: ShiftDir;
  idx: number;
}

@Component({
  selector: 'app-shift-arrows',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shift-arrows.component.html',
  styleUrl: './shift-arrows.component.css',
})
export class ShiftArrowsComponent implements OnChanges, OnDestroy {
  @Input() lastShift: ShiftPosition | null = null;
  @Input() canShift = false;
  @Input() tileSize = 80;
  @Input() spareTile: Tile | null = null;
  @Output() shift = new EventEmitter<ShiftPosition>();

  readonly allSlots = [0, 1, 2, 3, 4, 5, 6];

  hoveredDir = '';
  hoveredIdx = -1;
  ejectedPreview: TilePreview | null = null;
  private ejectedTimer: any;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['spareTile'] && !changes['spareTile'].firstChange && this.lastShift && this.spareTile) {
      this.showEjectedPreview(this.spareTile, this.lastShift);
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.ejectedTimer);
  }

  private showEjectedPreview(tile: Tile, shift: ShiftPosition): void {
    clearTimeout(this.ejectedTimer);
    const exitDir: Record<string, ShiftDir> = { left: 'right', right: 'left', up: 'down', down: 'up' };
    this.ejectedPreview = { tile: { ...tile }, dir: exitDir[shift.direction], idx: shift.index };
    this.ejectedTimer = setTimeout(() => { this.ejectedPreview = null; }, 1800);
  }

  isShiftable(index: number): boolean {
    return index === 1 || index === 3 || index === 5;
  }

  isBlocked(direction: string, index: number): boolean {
    if (!this.lastShift) return false;
    const reverse: Record<string, string> = { left: 'right', right: 'left', up: 'down', down: 'up' };
    return this.lastShift.index === index && reverse[this.lastShift.direction] === direction;
  }

  onHover(dir: string, idx: number): void {
    if (!this.canShift) return;
    this.hoveredDir = dir;
    this.hoveredIdx = idx;
  }

  onLeave(): void {
    this.hoveredDir = '';
    this.hoveredIdx = -1;
  }

  /** Touch-friendly: tap once to preview, tap again to confirm */
  onTap(dir: string, idx: number): void {
    if (!this.canShift || this.isBlocked(dir, idx)) return;

    // If already showing preview for this slot, emit the shift
    if (this.hoveredDir === dir && this.hoveredIdx === idx) {
      this.emit(dir, idx);
    } else {
      // Show preview on first tap
      this.hoveredDir = dir;
      this.hoveredIdx = idx;
    }
  }

  emit(direction: string, index: number): void {
    if (!this.canShift) return;
    if (!this.isBlocked(direction, index)) {
      this.shift.emit({ direction: direction as any, index: index as any });
    }
    this.onLeave();
  }

  getTileImageUrl(tile: Tile): string {
    switch (tile.type) {
      case 'straight': return 'tiles/straight.png';
      case 'curve':    return 'tiles/curve.png';
      default:         return 'tiles/t-cross.png';
    }
  }

  getTileCssRotation(tile: Tile): number {
    if (tile.type === 'straight') return tile.rotation;
    return (tile.rotation - 90 + 360) % 360;
  }
}
