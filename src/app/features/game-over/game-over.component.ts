import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player } from '../../core/models';

@Component({
  selector: 'app-game-over',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="go-root">
      <div class="go-bg"></div>
      <div class="go-vignette"></div>

      <!-- Floating embers -->
      <div class="embers">
        @for (e of embers; track e) {
          <div class="ember" [style.--x]="e.x + 'vw'" [style.--delay]="e.d + 's'" [style.--dur]="e.dur + 's'"></div>
        }
      </div>

      <div class="go-content">

        <!-- Crown ornament -->
        <div class="crown-ornament">
          <span class="ornament-line-short"></span>
          <span class="crown-icon">♛</span>
          <span class="ornament-line-short"></span>
        </div>

        <!-- Title -->
        <h1 class="victory-title">Sieg!</h1>
        <div class="victory-sub">Das Labyrinth wurde bezwungen</div>

        <!-- Winner portrait -->
        <div class="winner-medallion"
             [style.border-color]="winner.colorHex"
             [style.box-shadow]="'0 0 40px ' + winner.colorHex + '88, 0 0 80px ' + winner.colorHex + '33, inset 0 0 20px rgba(0,0,0,0.5)'">
          <div class="medallion-inner">
            <img [src]="'tiles/' + winner.avatar + '.png'" class="winner-portrait" [alt]="winner.name" />
          </div>
        </div>

        <!-- Winner name -->
        <div class="winner-name" [style.color]="winner.colorHex"
             [style.text-shadow]="'0 0 30px ' + winner.colorHex + ', 0 0 60px ' + winner.colorHex + '66'">
          {{ winner.name }}
        </div>
        <div class="winner-role">hat das Labyrinth gemeistert</div>

        <!-- Stats -->
        <div class="stats-row">
          <div class="stat-badge">
            <span class="stat-icon">✦</span>
            <span class="stat-value">{{ winner.collectedCards.length }}</span>
            <span class="stat-label">Schätze gesammelt</span>
          </div>
        </div>

        <!-- Divider -->
        <div class="go-divider"></div>

        <!-- Button -->
        <button class="new-game-btn" (click)="newGame.emit()">
          <span class="btn-rune">⚔</span>
          <span>Neues Abenteuer</span>
          <span class="btn-rune">⚔</span>
        </button>

      </div>
    </div>
  `,
  styles: [`
    /* ─── Root & Background ─────────── */
    .go-root {
      position: fixed; inset: 0;
      display: flex; align-items: center; justify-content: center;
      font-family: 'IM Fell English', Georgia, serif;
      color: var(--parchment);
      overflow: hidden;
    }
    .go-bg {
      position: absolute; inset: 0;
      background: url('/tiles/background.png') center / cover no-repeat;
      z-index: 0;
    }
    .go-vignette {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.82) 100%);
      z-index: 1; pointer-events: none;
    }

    /* ─── Floating embers ───────────── */
    .embers { position: absolute; inset: 0; z-index: 2; pointer-events: none; }
    .ember {
      position: absolute;
      bottom: -8px;
      left: var(--x, 50vw);
      width: 4px; height: 4px;
      border-radius: 50%;
      background: radial-gradient(circle, #f0c040 0%, #d4a017 60%, transparent 100%);
      animation: emberFloat var(--dur, 4s) var(--delay, 0s) ease-in infinite;
      opacity: 0;
    }
    @keyframes emberFloat {
      0%   { transform: translateY(0) translateX(0); opacity: 0; }
      10%  { opacity: 1; }
      90%  { opacity: 0.6; }
      100% { transform: translateY(-100vh) translateX(calc(sin(var(--x)) * 40px)); opacity: 0; }
    }

    /* ─── Content ───────────────────── */
    .go-content {
      position: relative; z-index: 3;
      display: flex; flex-direction: column; align-items: center;
      gap: 14px;
      animation: contentEnter 0.7s cubic-bezier(0.34, 1.2, 0.64, 1) both;
    }
    @keyframes contentEnter {
      from { opacity: 0; transform: scale(0.82) translateY(20px); }
      to   { opacity: 1; transform: scale(1)    translateY(0); }
    }

    /* ─── Crown ornament ────────────── */
    .crown-ornament {
      display: flex; align-items: center; gap: 16px;
    }
    .ornament-line-short {
      display: block; width: 60px; height: 1px;
      background: linear-gradient(90deg, transparent, var(--gold), transparent);
    }
    .crown-icon {
      font-size: 28px; color: var(--gold-bright);
      filter: drop-shadow(0 0 12px rgba(212,160,23,0.8));
      animation: crownPulse 3s ease-in-out infinite;
    }
    @keyframes crownPulse {
      0%,100% { filter: drop-shadow(0 0 12px rgba(212,160,23,0.8)); }
      50%     { filter: drop-shadow(0 0 24px rgba(240,192,64,1));    }
    }

    /* ─── Victory title ─────────────── */
    .victory-title {
      font-family: 'Cinzel Decorative', serif;
      font-size: 64px; font-weight: 700;
      color: var(--gold-bright);
      margin: 0; line-height: 1;
      letter-spacing: 0.12em;
      text-shadow: 0 0 40px rgba(212,160,23,0.8), 0 0 80px rgba(212,160,23,0.4), 0 4px 8px rgba(0,0,0,0.9);
      animation: titleGlow 2s ease-in-out infinite alternate;
    }
    @keyframes titleGlow {
      from { text-shadow: 0 0 40px rgba(212,160,23,0.8), 0 0 80px rgba(212,160,23,0.4), 0 4px 8px rgba(0,0,0,0.9); }
      to   { text-shadow: 0 0 60px rgba(240,192,64,1),   0 0 120px rgba(212,160,23,0.6), 0 4px 8px rgba(0,0,0,0.9); }
    }
    .victory-sub {
      font-family: 'IM Fell English', serif;
      font-style: italic; font-size: 14px;
      color: rgba(200,169,110,0.55);
      letter-spacing: 0.06em;
      margin-top: -8px;
    }

    /* ─── Winner medallion ──────────── */
    .winner-medallion {
      width: 120px; height: 120px;
      border-radius: 50%; border: 4px solid;
      padding: 6px;
      animation: medalSpin 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both 0.2s;
    }
    @keyframes medalSpin {
      from { scale: 0.3; opacity: 0; rotate: -30deg; }
      to   { scale: 1;   opacity: 1; rotate: 0deg;   }
    }
    .medallion-inner {
      width: 100%; height: 100%; border-radius: 50%;
      overflow: hidden; background: #d4b896;
    }
    .winner-portrait {
      width: 100%; height: 100%; object-fit: contain;
    }

    /* ─── Winner name & role ─────────── */
    .winner-name {
      font-family: 'Cinzel', serif;
      font-size: 28px; font-weight: 700;
      letter-spacing: 0.08em;
    }
    .winner-role {
      font-family: 'IM Fell English', serif;
      font-style: italic; font-size: 13px;
      color: rgba(200,169,110,0.5);
      margin-top: -8px;
    }

    /* ─── Stats ─────────────────────── */
    .stats-row { display: flex; gap: 16px; }
    .stat-badge {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 20px;
      background: rgba(212,160,23,0.08);
      border: 1px solid rgba(212,160,23,0.25);
      border-radius: 30px;
    }
    .stat-icon { font-size: 10px; color: var(--gold); }
    .stat-value {
      font-family: 'Cinzel', serif;
      font-size: 20px; font-weight: 700; color: var(--gold-bright);
    }
    .stat-label {
      font-family: 'IM Fell English', serif;
      font-style: italic; font-size: 12px;
      color: rgba(200,169,110,0.6);
    }

    /* ─── Divider ───────────────────── */
    .go-divider {
      width: 240px; height: 1px;
      background: linear-gradient(90deg, transparent, var(--gold-dim), transparent);
    }

    /* ─── New game button ───────────── */
    .new-game-btn {
      display: flex; align-items: center; gap: 14px;
      padding: 12px 40px;
      background: linear-gradient(135deg, rgba(212,160,23,0.18), rgba(212,160,23,0.08));
      border: 1px solid rgba(212,160,23,0.5); border-radius: 8px;
      color: var(--gold-bright);
      font-family: 'Cinzel Decorative', serif;
      font-size: 15px; font-weight: 700; letter-spacing: 0.08em;
      cursor: pointer;
      transition: all 0.25s ease;
      box-shadow: 0 0 30px rgba(212,160,23,0.15);
      text-shadow: 0 0 16px rgba(212,160,23,0.5);
    }
    .new-game-btn:hover {
      background: linear-gradient(135deg, rgba(212,160,23,0.32), rgba(212,160,23,0.16));
      border-color: rgba(212,160,23,0.8);
      box-shadow: 0 0 50px rgba(212,160,23,0.35);
      transform: translateY(-2px);
    }
    .btn-rune { font-size: 14px; opacity: 0.7; }
  `]
})
export class GameOverComponent {
  @Input() winner!: Player;
  @Output() newGame = new EventEmitter<void>();

  readonly embers = Array.from({ length: 18 }, (_, i) => ({
    x: 5 + Math.floor(i * 5.5) % 92,
    d: (i * 0.37) % 3,
    dur: 3.5 + (i * 0.4) % 2.5,
  }));
}
