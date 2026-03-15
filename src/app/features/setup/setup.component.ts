import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface PlayerConfig {
  name: string;
  isAI: boolean;
  aiDifficulty: 'easy' | 'medium' | 'hard';
  active: boolean;
  avatar: string;
  colorHex: string;
}

export interface SetupResult {
  players: PlayerConfig[];
  cardsPerPlayer: number;
}

const AVATARS = [
  'Player1', 'Player2', 'Player3', 'Player4',
  'Player5', 'Player6', 'Player7', 'Player8',
];

const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#6366f1', '#a855f7',
  '#ec4899', '#f43f5e', '#84cc16', '#06b6d4',
  '#10b981', '#d97706', '#8b5cf6', '#e2c97e',
];

const PLAYER_DEFAULTS = [
  { name: 'Spieler 1', colorHex: '#ef4444', avatar: 'Player1', isAI: false },
  { name: 'Spieler 2', colorHex: '#3b82f6', avatar: 'Player2', isAI: false },
  { name: 'Spieler 3', colorHex: '#22c55e', avatar: 'Player3', isAI: true  },
  { name: 'Spieler 4', colorHex: '#eab308', avatar: 'Player4', isAI: true  },
];

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.css',
})
export class SetupComponent {
  @Output() startGame = new EventEmitter<SetupResult>();

  readonly cardOptions = [3, 5, 7, 9];
  cardsPerPlayer = 5;

  avatars = AVATARS;
  palette = COLOR_PALETTE;

  players: PlayerConfig[] = PLAYER_DEFAULTS.map(d => ({
    name: d.name,
    isAI: d.isAI,
    aiDifficulty: 'medium' as const,
    active: true,
    avatar: d.avatar,
    colorHex: d.colorHex,
  }));

  // Track which color picker is open (-1 = none)
  openColorPicker = -1;

  get activePlayers(): PlayerConfig[] {
    return this.players.filter(p => p.active);
  }

  get canStart(): boolean {
    return this.activePlayers.length >= 2;
  }

  toggleActive(i: number): void {
    const activeCount = this.activePlayers.length;
    if (this.players[i].active && activeCount <= 2) return; // min 2
    this.players[i].active = !this.players[i].active;
    if (this.openColorPicker === i) this.openColorPicker = -1;
  }

  selectAvatar(player: PlayerConfig, av: string): void {
    player.avatar = av;
  }

  selectColor(player: PlayerConfig, hex: string, i: number): void {
    player.colorHex = hex;
    this.openColorPicker = -1;
  }

  toggleColorPicker(i: number): void {
    this.openColorPicker = this.openColorPicker === i ? -1 : i;
  }

  onStart(): void {
    if (this.canStart) {
      this.startGame.emit({ players: this.activePlayers, cardsPerPlayer: this.cardsPerPlayer });
    }
  }

  playerLabel(i: number): string {
    return ['I', 'II', 'III', 'IV'][i];
  }

  trackByIdx(i: number) { return i; }
}
