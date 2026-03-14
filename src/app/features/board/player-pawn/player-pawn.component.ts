import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerColor } from '../../../core/models';

const COLOR_MAP: Record<PlayerColor, string> = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308'
};

@Component({
  selector: 'app-player-pawn',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg width="24" height="24" viewBox="0 0 24 24" class="pawn-svg absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      <circle cx="12" cy="8" r="5" [attr.fill]="colorHex" stroke="white" stroke-width="1.5"/>
      <ellipse cx="12" cy="20" rx="7" ry="3" [attr.fill]="colorHex" stroke="white" stroke-width="1.5"/>
      <line x1="12" y1="13" x2="12" y2="17" stroke="white" stroke-width="1.5"/>
    </svg>
  `,
})
export class PlayerPawnComponent {
  @Input() color!: PlayerColor;
  get colorHex(): string { return COLOR_MAP[this.color]; }
}
