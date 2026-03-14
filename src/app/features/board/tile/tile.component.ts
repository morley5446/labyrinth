import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tile } from '../../../core/models';
import { tileSlideAnimation } from '../../../core/animations/game.animations';

// Tile indices in tilemap_packed.png (12 cols × 11 rows, 16px each, no gaps)
// Verified against sampleMap.tmx (firstgid=1, so map-ID n → tile index n-1)
const W  = 0;   // dark wall interior
const TL = 1;   // outer corner: floor south+east  (top-left of wall cap)
const TM = 2;   // top wall cap middle             (floor to south)
const TR = 3;   // outer corner: floor south+west  (top-right of wall cap)
const LM = 13;  // left wall cap                   (floor to east)
const RM = 15;  // right wall cap                  (floor to west)
const BL = 25;  // outer corner: floor north+east  (bottom-left of wall cap)
const BM = 26;  // bottom wall cap middle           (floor to north)
const BR = 27;  // outer corner: floor north+west  (bottom-right of wall cap)
const F  = 48;  // sandy floor

@Component({
  selector: 'app-tile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tile.component.html',
  styleUrl: './tile.component.css',
  animations: [tileSlideAnimation],
})
export class TileComponent implements OnChanges {
  @Input() tile!: Tile;
  @Input() highlighted = false;
  @Input() selected = false;
  @Input() size = 80;

  cells: number[] = [];

  ngOnChanges(): void {
    if (this.tile) this.cells = this.computeGrid();
  }

  bgPos(idx: number): string {
    const col = idx % 12;
    const row = Math.floor(idx / 12);
    return `-${col * 16}px -${row * 16}px`;
  }

  private computeGrid(): number[] {
    const { north, south, east, west } = this.tile.paths;

    const isFloor = (r: number, c: number): boolean => {
      if (r < 0 || r > 4 || c < 0 || c > 4) return false;
      if (r >= 1 && r <= 3 && c >= 1 && c <= 3) return true;   // center always floor
      if (r === 0 && c >= 1 && c <= 3) return north;
      if (r === 4 && c >= 1 && c <= 3) return south;
      if (c === 0 && r >= 1 && r <= 3) return west;
      if (c === 4 && r >= 1 && r <= 3) return east;
      if (r === 0 && c === 0) return north && west;
      if (r === 0 && c === 4) return north && east;
      if (r === 4 && c === 0) return south && west;
      if (r === 4 && c === 4) return south && east;
      return false;
    };

    const getTile = (r: number, c: number): number => {
      if (isFloor(r, c)) return F;
      const sF = isFloor(r + 1, c);
      const nF = isFloor(r - 1, c);
      const eF = isFloor(r, c + 1);
      const wF = isFloor(r, c - 1);
      // Outer corners (two perpendicular floor neighbours)
      if (sF && eF) return TL;
      if (sF && wF) return TR;
      if (nF && eF) return BL;
      if (nF && wF) return BR;
      // Single-face wall caps
      if (sF) return TM;
      if (nF) return BM;
      if (eF) return LM;
      if (wF) return RM;
      return W;
    };

    const grid: number[] = [];
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 5; c++)
        grid.push(getTile(r, c));
    return grid;
  }
}
