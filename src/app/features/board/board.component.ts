import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { GameService } from '../../core/services/game.service';
import { BoardService } from '../../core/services/board.service';
import { AiService } from '../../core/services/ai.service';
import { TileComponent } from './tile/tile.component';
import { ShiftArrowsComponent } from './shift-arrows/shift-arrows.component';
import { PlayerPawnComponent } from './player-pawn/player-pawn.component';
import { GameState, Position, ShiftPosition, Player, CollectedEvent } from '../../core/models';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, TileComponent, ShiftArrowsComponent, PlayerPawnComponent],
  templateUrl: './board.component.html',
  styleUrl: './board.component.css',
})
export class BoardComponent implements OnInit, OnDestroy {
  reachable: Position[] = [];
  private sub?: Subscription;
  private destroyed = false;

  // Shift animation
  shiftDir = '';
  shiftIdx = -1;
  shiftTick = 0;

  // Walk animation
  animatingMove = false;
  /** player.id → visual override position during walk */
  animatingPositions = new Map<number, Position>();

  // Treasure target highlight
  treasureKey = '';   // "row,col" of current player's target treasure on board

  // Responsive tile size
  tileSize = 80;

  constructor(
    public game: GameService,
    private boardSvc: BoardService,
    private ai: AiService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {
    this.computeTileSize();
  }

  @HostListener('window:resize')
  onResize(): void { this.computeTileSize(); }

  private computeTileSize(): void {
    const maxFromWidth  = (window.innerWidth  - 380) / 7;
    const maxFromHeight = (window.innerHeight - 124) / 7;
    this.tileSize = Math.max(44, Math.floor(Math.min(maxFromWidth, maxFromHeight)));
  }

  ngOnInit(): void {
    let firstLoad = true;
    this.sub = this.game.state$.subscribe(state => {
      if (state.lastCollected) {
        this.flyTreasureToAvatar(state.lastCollected);
      }
      this.treasureKey = this.findTreasureKey(state);

      if (state.phase === 'move') {
        const player = state.players[state.currentPlayerIndex];
        this.reachable = this.boardSvc.getReachablePositions(state.board, player.position);
        if (player.isAI) this.scheduleAiMove(state);
      } else if (state.phase === 'shift') {
        this.reachable = [];
        const player = state.players[state.currentPlayerIndex];
        if (player.isAI) this.scheduleAiShift(state);
        // Fog reveal on first board load
        if (firstLoad && state.board.length > 0) {
          firstLoad = false;
          this.ngZone.runOutsideAngular(() => {
            setTimeout(() => this.playFogReveal(), 100);
          });
        }
      } else {
        this.reachable = [];
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.sub?.unsubscribe();
  }

  // ─── Helpers for template ────────────────────────────────────────

  isReachable(row: number, col: number): boolean {
    if (this.animatingMove) return false;
    return this.reachable.some(p => p.row === row && p.col === col);
  }

  isTreasureTile(row: number, col: number): boolean {
    return this.treasureKey === `${row},${col}`;
  }

  /** Returns players whose startPosition is at (row, col) */
  startMarkersAt(state: GameState, row: number, col: number): Player[] {
    return state.players.filter(p => p.startPosition.row === row && p.startPosition.col === col);
  }

  /** Returns players at this tile, using animated positions when a walk is in progress */
  playersAt(state: GameState, row: number, col: number): Player[] {
    return state.players.filter(p => {
      const anim = this.animatingPositions.get(p.id);
      const pos = anim ?? p.position;
      return pos.row === row && pos.col === col;
    });
  }

  // Row/tile animations are now fully JS-driven (see animateShiftJS)

  onShift(shift: ShiftPosition): void {
    if (this.animatingMove) return;
    if (this.shiftDir !== '') return; // prevent double-click during animation

    this.shiftDir = shift.direction;
    this.shiftIdx = shift.index;

    // Animate OLD board first (tiles slide outward), then update state
    this.ngZone.runOutsideAngular(() => {
      this.animateShiftJS(shift.direction, shift.index, () => {
        this.ngZone.run(() => {
          this.game.performShift(shift);
          this.cdr.detectChanges();
          this.shiftDir = '';
          this.shiftIdx = -1;
        });
      });
      this.spawnShiftParticles(shift.direction, shift.index);
    });
  }

  onTileClick(state: GameState, row: number, col: number): void {
    if (this.animatingMove) return;
    if (state.phase === 'move' && this.isReachable(row, col)) {
      this.performMoveWithAnimation(state, { row, col });
    }
  }

  // ─── Treasure finder ────────────────────────────────────────────

  private findTreasureKey(state: GameState): string {
    const player = state.players[state.currentPlayerIndex];
    if (!player) return '';

    if (player.cards.length > 0) {
      const target = player.cards[0];
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (state.board[r][c]?.treasure === target) return `${r},${c}`;
        }
      }
      return ''; // treasure is on the spare tile
    }

    // No cards left → return to start
    return `${player.startPosition.row},${player.startPosition.col}`;
  }

  // ─── Walk animation ──────────────────────────────────────────────

  private async performMoveWithAnimation(state: GameState, target: Position): Promise<void> {
    const player = state.players[state.currentPlayerIndex];
    const path = this.boardSvc.getPath(state.board, player.position, target);

    if (!path || path.length < 2) {
      this.game.performMove(target);
      return;
    }

    this.animatingMove = true;
    this.reachable = [];
    // Initialise: show player at current position via animatingPositions so
    // the switch from state-driven to animation-driven is seamless.
    this.animatingPositions.set(player.id, path[0]);
    this.cdr.detectChanges();

    // Walk each step (path[0] is start, skip it)
    for (let i = 1; i < path.length; i++) {
      if (this.destroyed) return;
      await this.animDelay(280);
      this.animatingPositions.set(player.id, path[i]);
      this.cdr.detectChanges(); // Force view update after Map mutation
    }

    await this.animDelay(160);
    if (this.destroyed) return;

    this.animatingPositions.delete(player.id);
    this.animatingMove = false;
    this.cdr.detectChanges();
    this.game.performMove(target);
  }

  private animDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ─── Treasure fly animation ───────────────────────────────────────

  private flyTreasureToAvatar(ev: CollectedEvent): void {
    const tileEl = document.getElementById(`tile-${ev.tileRow}-${ev.tileCol}`);
    const pipEl  = document.getElementById(`player-pip-${ev.playerId}`);
    if (!tileEl || !pipEl) return;

    const tileRect = tileEl.getBoundingClientRect();
    const pipRect  = pipEl.getBoundingClientRect();

    const startX = tileRect.left + tileRect.width  / 2;
    const startY = tileRect.top  + tileRect.height / 2;
    const endX   = pipRect.left  + pipRect.width   / 2;
    const endY   = pipRect.top   + pipRect.height  / 2;

    const size = 40;
    const img = document.createElement('img');
    img.src = `icons/${ev.treasure}.jpg`;
    img.style.cssText = `
      position: fixed;
      width: ${size}px; height: ${size}px;
      border-radius: 6px;
      left: ${startX - size / 2}px;
      top:  ${startY - size / 2}px;
      pointer-events: none;
      z-index: 9999;
      box-shadow: 0 0 12px rgba(212,160,23,0.8), 0 0 4px rgba(0,0,0,0.6);
      transition: none;
    `;
    document.body.appendChild(img);

    // Force reflow then animate
    void img.offsetWidth;

    const dx = endX - startX;
    const dy = endY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dur  = Math.min(1400, Math.max(900, dist * 1.1));

    // Inject keyframe once
    const keyId = `fly-${ev.playerId}-${Date.now()}`;
    const arcY  = Math.min(-80, -dist * 0.35);
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ${keyId} {
        0%   { transform: translate(0,       0)      scale(1);    opacity: 1; }
        40%  { transform: translate(${dx*0.4}px, ${arcY}px) scale(1.15); opacity: 1; }
        100% { transform: translate(${dx}px,  ${dy}px)  scale(0.3);  opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    img.style.animation = `${keyId} ${dur}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`;

    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        img.remove();
        style.remove();
      }, dur + 50);
    });
  }

  // ─── Shift animation ─────────────────────────────────────────────

  // triggerShiftAnim removed — AI now uses onShift directly

  // ─── JS-driven shift animation ─────────────────────────────────

  private animateShiftJS(dir: string, idx: number, onComplete?: () => void): void {
    const tileOffset = this.tileSize + 2;
    const duration = 1400;
    const isRow = dir === 'left' || dir === 'right';

    // Find elements to animate (existing tiles)
    const elements: HTMLElement[] = [];
    if (isRow) {
      const rows = document.querySelectorAll('.board-row');
      if (rows[idx]) elements.push(rows[idx] as HTMLElement);
    } else {
      for (let r = 0; r < 7; r++) {
        const tile = document.getElementById(`tile-${r}-${idx}`);
        if (tile) elements.push(tile);
      }
    }
    if (elements.length === 0) {
      onComplete?.();
      return;
    }

    // Push-outward direction: existing tiles slide out
    // left = spare enters from left → tiles pushed RIGHT (+X)
    // right = spare enters from right → tiles pushed LEFT (-X)
    // up = spare enters from bottom → tiles pushed UP (-Y)
    // down = spare enters from top → tiles pushed DOWN (+Y)
    const slideTo = (dir === 'left') ? tileOffset
                  : (dir === 'right') ? -tileOffset
                  : (dir === 'up') ? -tileOffset
                  : tileOffset; // down
    const prop = isRow ? 'translateX' : 'translateY';
    const rumbleProp = isRow ? 'translateY' : 'translateX';

    // ── Create spare tile clone that slides IN from the entry edge ──
    const spareTileEl = this.createSpareTileClone(dir, idx, tileOffset);

    // ── Change board background to stone grey ──
    const boardGrid = document.querySelector('.board-grid') as HTMLElement;
    if (boardGrid) {
      boardGrid.style.transition = 'background 0.3s';
      boardGrid.style.background = 'linear-gradient(135deg, #2a2828, #1a1919)';
    }

    // Start at position 0
    for (const el of elements) {
      el.style.transform = `${prop}(0px)`;
      el.style.zIndex = '2';
    }

    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);

      // ── Slide: ease-in-out from 0 → slideTo ──
      const eased = t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const slide = slideTo * eased;

      // ── Spare tile slides in: from -slideTo → 0 (opposite direction) ──
      const spareSlide = -slideTo * (1 - eased);

      // ── Glow: ramps up then down ──
      let glow: number;
      if (t < 0.08) glow = t / 0.08;
      else if (t < 0.5) glow = 1;
      else glow = Math.max(0, 1 - (t - 0.5) / 0.5);

      const brightness = 1 + 0.12 * glow;
      const shadowAlpha = (0.4 * glow).toFixed(2);
      const shadowSpread = Math.round(24 * glow);

      // ── Rumble: decaying oscillation, ~4px amplitude ──
      const rumbleDecay = Math.max(0, 1 - t * 1.5);
      const rumbleAmp = 4 * rumbleDecay;
      const rumble = rumbleAmp * Math.sin(elapsed * 0.02) * Math.cos(elapsed * 0.013);

      const transformVal = `${prop}(${slide}px) ${rumbleProp}(${rumble}px)`;
      const filterVal = `brightness(${brightness.toFixed(3)})`;
      const shadowVal = glow > 0.01
        ? `0 0 ${shadowSpread}px rgba(212,160,23,${shadowAlpha})`
        : 'none';

      for (const el of elements) {
        el.style.transform = transformVal;
        el.style.filter = filterVal;
        el.style.boxShadow = shadowVal;
      }

      // Animate spare tile clone
      if (spareTileEl) {
        spareTileEl.style.transform = `${prop}(${spareSlide}px) ${rumbleProp}(${rumble}px)`;
        spareTileEl.style.filter = filterVal;
        spareTileEl.style.boxShadow = shadowVal;
      }

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        // Clean up inline styles
        for (const el of elements) {
          el.style.transform = '';
          el.style.filter = '';
          el.style.boxShadow = '';
          el.style.zIndex = '';
        }
        // Remove spare tile clone
        spareTileEl?.remove();
        // Restore board background
        if (boardGrid) {
          boardGrid.style.background = '';
          setTimeout(() => { boardGrid.style.transition = ''; }, 400);
        }
        onComplete?.();
      }
    };

    requestAnimationFrame(tick);
  }

  /** Creates a temporary DOM element that looks like the spare tile, positioned at the entry edge */
  private createSpareTileClone(dir: string, idx: number, tileOffset: number): HTMLElement | null {
    const state = this.game.snapshot;
    if (!state.spareTile) return null;

    const spare = state.spareTile;
    const isRow = dir === 'left' || dir === 'right';

    // Determine tile image and rotation
    let imgSrc: string;
    switch (spare.type) {
      case 'straight': imgSrc = 'tiles/straight.png'; break;
      case 'curve': imgSrc = 'tiles/curve.png'; break;
      default: imgSrc = 'tiles/t-cross.png'; break;
    }
    const cssRot = spare.type === 'straight' ? spare.rotation : (spare.rotation - 90 + 360) % 360;

    // Find the anchor element to position relative to
    let anchorEl: HTMLElement | null = null;
    if (isRow) {
      // For rows, position at entry side of the row
      if (dir === 'left') {
        anchorEl = document.getElementById(`tile-${idx}-0`);
      } else {
        anchorEl = document.getElementById(`tile-${idx}-6`);
      }
    } else {
      // For columns, position at entry side of the column
      if (dir === 'up') {
        anchorEl = document.getElementById(`tile-6-${idx}`);
      } else {
        anchorEl = document.getElementById(`tile-0-${idx}`);
      }
    }
    if (!anchorEl) return null;

    const anchorRect = anchorEl.getBoundingClientRect();

    // Position clone at the anchor tile (animation transform handles sliding it in from outside)
    const left = anchorRect.left;
    const top = anchorRect.top;

    const clone = document.createElement('div');
    clone.style.cssText = `
      position: fixed;
      left: ${left}px;
      top: ${top}px;
      width: ${this.tileSize}px;
      height: ${this.tileSize}px;
      z-index: 10;
      pointer-events: none;
      overflow: hidden;
      border-radius: 4px;
    `;

    const img = document.createElement('img');
    img.src = imgSrc;
    img.style.cssText = `
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: rotate(${cssRot}deg);
    `;
    clone.appendChild(img);

    // Add treasure icon if present
    if (spare.treasure) {
      const treasureImg = document.createElement('img');
      treasureImg.src = `icons/${spare.treasure}.jpg`;
      treasureImg.style.cssText = `
        position: absolute;
        width: 55%;
        height: 55%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        border-radius: 4px;
        pointer-events: none;
      `;
      clone.appendChild(treasureImg);
    }

    document.body.appendChild(clone);
    return clone;
  }

  // ─── Particle system ────────────────────────────────────────────

  private spawnShiftParticles(dir: string, idx: number): void {
    const isRow = dir === 'left' || dir === 'right';

    // Build the bounding rect for the shifting row or column
    let sourceRect: DOMRect;
    if (isRow) {
      const rows = document.querySelectorAll('.board-row');
      if (!rows[idx]) return;
      sourceRect = (rows[idx] as HTMLElement).getBoundingClientRect();
    } else {
      // For columns, compute combined rect from first and last tile
      const first = document.getElementById(`tile-0-${idx}`);
      const last = document.getElementById(`tile-6-${idx}`);
      if (!first || !last) return;
      const fr = first.getBoundingClientRect();
      const lr = last.getBoundingClientRect();
      sourceRect = new DOMRect(fr.left, fr.top, fr.width, lr.bottom - fr.top);
    }

    // Bright dust/spark colors — visible against dark board
    const COLORS = [
      'rgba(210,190,150,0.95)',
      'rgba(230,210,170,0.9)',
      'rgba(200,180,140,0.85)',
      'rgba(180,165,130,0.9)',
      'rgba(255,250,240,0.95)',
      'rgba(255,245,220,0.9)',
      'rgba(240,230,200,0.85)',
      'rgba(212,160,23,0.8)',
    ];

    const COUNT = 70;
    const DURATION = 1800;

    for (let i = 0; i < COUNT; i++) {
      const delay = Math.random() * 1200;
      setTimeout(() => this.createParticle(dir, sourceRect, COLORS, DURATION), delay);
    }
  }

  private createParticle(
    dir: string, sourceRect: DOMRect,
    colors: string[], duration: number
  ): void {
    const p = document.createElement('div');
    const size = 2 + Math.random() * 4;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const isRow = dir === 'left' || dir === 'right';

    let startX: number, startY: number;
    let vx: number, vy: number;

    if (isRow) {
      const edge = Math.random();
      if (edge < 0.4) {
        startX = sourceRect.left + Math.random() * sourceRect.width;
        startY = sourceRect.top - Math.random() * 3;
        vx = (Math.random() - 0.5) * 60;
        vy = -(30 + Math.random() * 80);
      } else if (edge < 0.8) {
        startX = sourceRect.left + Math.random() * sourceRect.width;
        startY = sourceRect.bottom + Math.random() * 3;
        vx = (Math.random() - 0.5) * 60;
        vy = 30 + Math.random() * 80;
      } else if (edge < 0.9) {
        startX = sourceRect.left - Math.random() * 3;
        startY = sourceRect.top + Math.random() * sourceRect.height;
        vx = -(40 + Math.random() * 60);
        vy = (Math.random() - 0.5) * 50;
      } else {
        startX = sourceRect.right + Math.random() * 3;
        startY = sourceRect.top + Math.random() * sourceRect.height;
        vx = 40 + Math.random() * 60;
        vy = (Math.random() - 0.5) * 50;
      }
    } else {
      const edge = Math.random();
      if (edge < 0.4) {
        startX = sourceRect.left - Math.random() * 3;
        startY = sourceRect.top + Math.random() * sourceRect.height;
        vx = -(30 + Math.random() * 80);
        vy = (Math.random() - 0.5) * 60;
      } else if (edge < 0.8) {
        startX = sourceRect.right + Math.random() * 3;
        startY = sourceRect.top + Math.random() * sourceRect.height;
        vx = 30 + Math.random() * 80;
        vy = (Math.random() - 0.5) * 60;
      } else if (edge < 0.9) {
        startX = sourceRect.left + Math.random() * sourceRect.width;
        startY = sourceRect.top - Math.random() * 3;
        vx = (Math.random() - 0.5) * 50;
        vy = -(40 + Math.random() * 60);
      } else {
        startX = sourceRect.left + Math.random() * sourceRect.width;
        startY = sourceRect.bottom + Math.random() * 3;
        vx = (Math.random() - 0.5) * 50;
        vy = 40 + Math.random() * 60;
      }
    }

    p.style.cssText = `
      position: fixed;
      left: ${startX}px;
      top: ${startY}px;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${color};
      pointer-events: none;
      z-index: 100;
      will-change: transform, opacity;
      box-shadow: 0 0 ${size + 3}px ${color}, 0 0 ${size * 2}px rgba(212,160,23,0.3);
    `;
    document.body.appendChild(p);

    const start = performance.now();
    const life = duration * (0.3 + Math.random() * 0.5);

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = elapsed / life;
      if (t >= 1) { p.remove(); return; }

      const x = vx * t;
      const y = vy * t + 25 * t * t; // gravity
      const opacity = t < 0.1 ? t / 0.1 : 1 - (t - 0.1) / 0.9;
      const scale = 1 - t * 0.3; // shrink as they fly

      p.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      p.style.opacity = `${Math.max(0, opacity)}`;
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  // ─── Fog reveal animation ───────────────────────────────────────

  private playFogReveal(): void {
    const boardGrid = document.querySelector('.board-grid') as HTMLElement;
    if (!boardGrid) return;

    const rect = boardGrid.getBoundingClientRect();

    // Create fog overlay canvas covering the board area with generous padding
    const pad = 80;
    const canvas = document.createElement('canvas');
    const cw = rect.width + pad * 2;
    const ch = rect.height + pad * 2;
    canvas.width = cw;
    canvas.height = ch;
    canvas.style.cssText = `
      position: fixed;
      left: ${rect.left - pad}px;
      top: ${rect.top - pad}px;
      width: ${cw}px;
      height: ${ch}px;
      z-index: 50;
      pointer-events: none;
    `;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d')!;

    // Generate fog clouds — large soft circles
    interface FogCloud {
      x: number; y: number; r: number;
      vx: number; vy: number;
      opacity: number;
      color: string;
    }

    const clouds: FogCloud[] = [];
    const CLOUD_COUNT = 35;
    for (let i = 0; i < CLOUD_COUNT; i++) {
      const base = 15 + Math.random() * 25;
      const purple = Math.random() * 0.5; // mix in some purple tint
      const r = Math.round(base + purple * 20);
      const g = Math.round(base - purple * 5);
      const b = Math.round(base + purple * 35);
      clouds.push({
        x: Math.random() * cw,
        y: Math.random() * ch,
        r: 60 + Math.random() * 140,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 30,
        opacity: 0.7 + Math.random() * 0.3,
        color: `rgb(${r},${g},${b})`,
      });
    }

    // Spawn magical spark particles that drift outward
    const SPARK_COLORS = [
      [160, 60, 220],   // purple
      [130, 40, 200],   // deep purple
      [190, 80, 255],   // bright violet
      [100, 50, 180],   // dark violet
      [200, 120, 255],  // lavender
      [140, 20, 180],   // magenta-purple
      [80, 60, 200],    // blue-violet
      [220, 160, 255],  // light lilac
      [255, 200, 255],  // pink-white sparkle
      [180, 100, 240],  // medium purple
    ];
    const fogParticles: { x: number; y: number; vx: number; vy: number; size: number; life: number; maxLife: number; color: string }[] = [];
    const spawnFogParticle = () => {
      const cx = cw / 2;
      const cy = ch / 2;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * Math.min(cw, ch) * 0.4;
      const [sr, sg, sb] = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];
      fogParticles.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        vx: Math.cos(angle) * (20 + Math.random() * 60),
        vy: Math.sin(angle) * (20 + Math.random() * 60) - 15,
        size: 1.5 + Math.random() * 4,
        life: 0,
        maxLife: 1500 + Math.random() * 1500,
        color: `rgba(${sr},${sg},${sb},`,
      });
    };

    const TOTAL_DURATION = 3500;
    const startTime = performance.now();

    // Spawn particles over time
    let particlesSpawned = 0;
    const TARGET_PARTICLES = 120;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / TOTAL_DURATION);

      // Spawn particles during first 60% of animation
      if (t < 0.6) {
        const targetNow = Math.floor(t / 0.6 * TARGET_PARTICLES);
        while (particlesSpawned < targetNow) {
          spawnFogParticle();
          particlesSpawned++;
        }
      }

      ctx.clearRect(0, 0, cw, ch);

      // ── Draw fog clouds: fade out and drift away ──
      const cloudOpacity = t < 0.2 ? 1 : Math.max(0, 1 - (t - 0.2) / 0.8);
      for (const c of clouds) {
        c.x += c.vx * (1 / 60);
        c.y += c.vy * (1 / 60);
        // Accelerate outward as they fade
        c.vx *= 1.008;
        c.vy *= 1.008;

        const alpha = c.opacity * cloudOpacity;
        if (alpha < 0.01) continue;

        const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
        grad.addColorStop(0, c.color.replace('rgb', 'rgba').replace(')', `,${alpha})`));
        grad.addColorStop(0.5, c.color.replace('rgb', 'rgba').replace(')', `,${alpha * 0.5})`));
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(c.x - c.r, c.y - c.r, c.r * 2, c.r * 2);
      }

      // ── Draw fog particles ──
      const dt = 1 / 60;
      for (let i = fogParticles.length - 1; i >= 0; i--) {
        const fp = fogParticles[i];
        fp.life += 16.7;
        const pt = fp.life / fp.maxLife;
        if (pt >= 1) { fogParticles.splice(i, 1); continue; }

        fp.x += fp.vx * dt;
        fp.y += fp.vy * dt;
        fp.vy -= 8 * dt; // slight upward drift

        const pOpacity = pt < 0.15 ? pt / 0.15 : 1 - (pt - 0.15) / 0.85;
        const pScale = 1 + pt * 0.5;

        // Outer glow
        ctx.beginPath();
        ctx.arc(fp.x, fp.y, fp.size * pScale * 3, 0, Math.PI * 2);
        ctx.fillStyle = fp.color + `${Math.max(0, pOpacity * 0.12)})`;
        ctx.fill();

        // Inner glow
        ctx.beginPath();
        ctx.arc(fp.x, fp.y, fp.size * pScale * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = fp.color + `${Math.max(0, pOpacity * 0.35)})`;
        ctx.fill();

        // Bright core
        ctx.beginPath();
        ctx.arc(fp.x, fp.y, fp.size * pScale * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,230,255,${Math.max(0, pOpacity * 0.9)})`;
        ctx.fill();
      }

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        canvas.remove();
      }
    };

    requestAnimationFrame(tick);
  }

  // ─── AI scheduling ───────────────────────────────────────────────

  private aiDelay(state: GameState): number {
    return state.settings.aiSpeed === 'slow' ? 1500 : state.settings.aiSpeed === 'fast' ? 400 : 800;
  }

  private scheduleAiShift(state: GameState): void {
    setTimeout(() => {
      if (this.destroyed) return;
      const current = this.game.snapshot;
      if (current.phase !== 'shift') return;
      const move = this.ai.calculateMove(current);
      this.onShift(move.shift);
    }, this.aiDelay(state));
  }

  private scheduleAiMove(state: GameState): void {
    setTimeout(async () => {
      if (this.destroyed) return;
      const current = this.game.snapshot;
      if (current.phase !== 'move') return;
      const player = current.players[current.currentPlayerIndex];
      const reachable = this.boardSvc.getReachablePositions(current.board, player.position);
      if (reachable.length === 0) return;
      const target = this.pickBestTarget(current, player, reachable);
      await this.performMoveWithAnimation(current, target);
    }, this.aiDelay(state));
  }

  private pickBestTarget(state: GameState, player: Player, reachable: Position[]): Position {
    if (player.aiDifficulty === 'easy') {
      return reachable[Math.floor(Math.random() * reachable.length)];
    }
    const targetTreasure = player.cards[0];
    if (targetTreasure) {
      const pos = reachable.find(p => state.board[p.row][p.col].treasure === targetTreasure);
      if (pos) return pos;
    }
    if (player.cards.length === 0) {
      return reachable.reduce((best, pos) => {
        const d  = Math.abs(pos.row  - player.startPosition.row) + Math.abs(pos.col  - player.startPosition.col);
        const bd = Math.abs(best.row - player.startPosition.row) + Math.abs(best.col - player.startPosition.col);
        return d < bd ? pos : best;
      }, reachable[0]);
    }
    return reachable[Math.floor(Math.random() * reachable.length)];
  }
}
