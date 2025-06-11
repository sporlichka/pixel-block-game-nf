export interface Player {
  id: string;
  x: number;
  y: number;
  color: string;
  name: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface GameState {
  players: Record<string, Player>;
}
