import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tile } from '../../../core/models';

@Component({
  selector: 'app-tile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tile.component.html',
  styleUrl: './tile.component.css',
})
export class TileComponent {
  @Input() tile!: Tile;
  @Input() highlighted = false;
  @Input() selected = false;
  @Input() size = 80;
}
