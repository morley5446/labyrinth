import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GameState, GameSettings } from '../models/game-state.model';
import { ShiftPosition } from '../models/tile.model';
import { Position } from '../models/player.model';
import { BoardService } from './board.service';

const DEFAULT_SETTINGS: GameSettings = {
  showReachableFields: true,
  aiSpeed: 'normal',
};

const INITIAL_STATE: GameState = {
  board: [],
  spareTile: null!,
  players: [],
  currentPlayerIndex: 0,
  phase: 'setup',
  lastShift: null,
  settings: DEFAULT_SETTINGS,
  winner: null,
};

@Injectable({ providedIn: 'root' })
export class GameService {
  private stateSubject = new BehaviorSubject<GameState>(INITIAL_STATE);
  state$ = this.stateSubject.asObservable();

  constructor(private board: BoardService) {}

  get snapshot(): GameState {
    return this.stateSubject.getValue();
  }

  startGame(configs: { name: string; isAI: boolean; aiDifficulty?: any }[]): void {
    const { board, spareTile } = this.board.initializeBoard(configs.length);
    const players = this.board.initializePlayers(configs, configs.length);
    this.stateSubject.next({
      ...INITIAL_STATE,
      board, spareTile, players,
      phase: 'shift',
      settings: { ...DEFAULT_SETTINGS },
    });
  }

  performShift(shift: ShiftPosition): void {
    const state = this.snapshot;
    if (state.phase !== 'shift') return;
    if (this.board.isReverseShift(state.lastShift, shift)) return;

    const { newBoard, newSpare, newPlayers } = this.board.shiftTiles(
      state.board, state.spareTile, shift, state.players
    );

    this.stateSubject.next({
      ...state,
      board: newBoard,
      spareTile: newSpare,
      players: newPlayers ?? state.players,
      phase: 'move',
      lastShift: shift,
    });
  }

  performMove(target: Position): void {
    const state = this.snapshot;
    if (state.phase !== 'move') return;

    const player = state.players[state.currentPlayerIndex];
    const reachable = this.board.getReachablePositions(state.board, player.position);
    const isReachable = reachable.some(p => p.row === target.row && p.col === target.col);
    if (!isReachable) return;

    const newPlayers = state.players.map((p, i) => {
      if (i !== state.currentPlayerIndex) return p;
      const updated = { ...p, position: target };
      const tile = state.board[target.row][target.col];
      if (tile.treasure && p.cards[0] === tile.treasure) {
        updated.cards = p.cards.slice(1);
        updated.collectedCards = [...p.collectedCards, tile.treasure];
      }
      return updated;
    });

    const currentPlayer = newPlayers[state.currentPlayerIndex];
    const hasWon =
      currentPlayer.cards.length === 0 &&
      currentPlayer.position.row === currentPlayer.startPosition.row &&
      currentPlayer.position.col === currentPlayer.startPosition.col;

    const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;

    this.stateSubject.next({
      ...state,
      players: newPlayers,
      phase: hasWon ? 'game-over' : 'shift',
      currentPlayerIndex: hasWon ? state.currentPlayerIndex : nextIndex,
      winner: hasWon ? newPlayers[state.currentPlayerIndex] : null,
    });
  }

  updateSettings(settings: Partial<GameSettings>): void {
    const state = this.snapshot;
    this.stateSubject.next({
      ...state,
      settings: { ...state.settings, ...settings },
    });
  }

  resetGame(): void {
    this.stateSubject.next(INITIAL_STATE);
  }
}
