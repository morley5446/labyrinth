import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface PlayerConfig {
  name: string;
  isAI: boolean;
  aiDifficulty: 'easy' | 'medium' | 'hard';
  active: boolean;
}

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.css',
})
export class SetupComponent {
  @Output() startGame = new EventEmitter<PlayerConfig[]>();

  players: PlayerConfig[] = [
    { name: 'Spieler 1', isAI: false, aiDifficulty: 'medium', active: true },
    { name: 'Spieler 2', isAI: false, aiDifficulty: 'medium', active: true },
    { name: 'Spieler 3', isAI: true,  aiDifficulty: 'medium', active: false },
    { name: 'Spieler 4', isAI: true,  aiDifficulty: 'medium', active: false },
  ];

  colors = ['red', 'blue', 'green', 'yellow'];
  colorLabels = ['Rot', 'Blau', 'Grün', 'Gelb'];

  get activePlayers(): PlayerConfig[] {
    return this.players.filter(p => p.active);
  }

  get canStart(): boolean {
    return this.activePlayers.length >= 2;
  }

  onStart(): void {
    if (this.canStart) {
      this.startGame.emit(this.activePlayers);
    }
  }
}
