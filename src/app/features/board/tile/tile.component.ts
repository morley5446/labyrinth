import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tile } from '../../../core/models';
import { tileSlideAnimation } from '../../../core/animations/game.animations';

@Component({
  selector: 'app-tile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tile.component.html',
  styleUrl: './tile.component.css',
  animations: [tileSlideAnimation],
})
export class TileComponent {
  @Input() tile!: Tile;
  @Input() highlighted = false;
  @Input() selected = false;
  @Input() size = 80;
  @Input() isTarget = false;

  get tileImage(): string {
    switch (this.tile.type) {
      case 'straight': return 'tiles/straight.png';
      case 'curve':    return 'tiles/curve.png';
      default:         return 'tiles/t-cross.png';  // 'T'
    }
  }

  // straight.png base = rotation 0 (N+S)
  // curve.png and t-cross.png base = rotation 90 (S+E and N+S+E)
  get cssRotation(): number {
    if (this.tile.type === 'straight') return this.tile.rotation;
    return (this.tile.rotation - 90 + 360) % 360;
  }
}
