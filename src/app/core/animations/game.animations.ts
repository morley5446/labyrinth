import { animate, style, transition, trigger, keyframes } from '@angular/animations';

export const tileSlideAnimation = trigger('tileSlide', [
  transition(':enter', [
    style({ transform: 'translateX(-100%)', opacity: 0 }),
    animate('400ms ease-in-out', style({ transform: 'translateX(0)', opacity: 1 })),
  ]),
]);

export const pawnMoveAnimation = trigger('pawnMove', [
  transition('* => *', [
    animate('300ms cubic-bezier(0.34, 1.56, 0.64, 1)'),
  ]),
]);

export const cardFlipAnimation = trigger('cardFlip', [
  transition(':enter', [
    animate('600ms ease-in-out', keyframes([
      style({ transform: 'rotateY(0deg)', offset: 0 }),
      style({ transform: 'rotateY(90deg)', offset: 0.5 }),
      style({ transform: 'rotateY(0deg)', offset: 1 }),
    ])),
  ]),
]);

export const highlightPulseAnimation = trigger('highlightPulse', [
  transition(':enter', [
    animate('1000ms ease-in-out', keyframes([
      style({ opacity: 0.1, offset: 0 }),
      style({ opacity: 0.3, offset: 0.5 }),
      style({ opacity: 0.1, offset: 1 }),
    ])),
  ]),
]);
