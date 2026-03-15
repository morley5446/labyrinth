import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

// Position offsets [left%, top%] and sizes for each pawn count
const LAYOUTS: [number, number][][] = [
  [[50, 50]],                                           // 1 pawn
  [[28, 50], [72, 50]],                                 // 2 pawns
  [[22, 34], [78, 34], [50, 72]],                       // 3 pawns
  [[26, 26], [74, 26], [26, 74], [74, 74]],             // 4 pawns
];
const SIZES = [40, 32, 26, 22];

@Component({
  selector: 'app-player-pawn',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pawn-frame"
         [style.left.%]="left"
         [style.top.%]="top"
         [style.width.px]="size"
         [style.height.px]="size"
         [style.border-color]="colorHex"
         [style.box-shadow]="'0 0 10px ' + colorHex + ', 0 0 3px rgba(0,0,0,0.8)'">
      <img [src]="'tiles/' + avatar + '.png'" class="pawn-img" alt="" />
    </div>
  `,
  styles: [`
    .pawn-frame {
      position: absolute;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      border: 2.5px solid;
      overflow: hidden;
      background: #d4b896;
      pointer-events: none;
      animation: pawnArrive 240ms ease-out both;
      z-index: 5;
    }
    .pawn-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    @keyframes pawnArrive {
      from { scale: 0.7; opacity: 0; }
      to   { scale: 1;   opacity: 1; }
    }
  `]
})
export class PlayerPawnComponent {
  @Input() colorHex!: string;
  @Input() avatar!: string;
  @Input() pawnIndex = 0;
  @Input() pawnCount = 1;

  private layout(): [number, number] {
    const row = LAYOUTS[Math.min(this.pawnCount - 1, LAYOUTS.length - 1)];
    return row[Math.min(this.pawnIndex, row.length - 1)] ?? [50, 50];
  }

  get left(): number  { return this.layout()[0]; }
  get top(): number   { return this.layout()[1]; }
  get size(): number  { return SIZES[Math.min(this.pawnCount - 1, SIZES.length - 1)]; }
}
