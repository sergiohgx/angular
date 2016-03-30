export interface DomAnimatePlayer {
  cancel(): void;
  play(): void;
  pause(): void;
  reverse(): void;
  stop(): void;
  onfinish: Function;
  position: number;
}
