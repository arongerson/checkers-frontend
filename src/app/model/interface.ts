export interface Position {
    row: number;
    col: number;
}
  
export interface Play {
    from: Position;
    to: Position;
    captured: Position;
}

export interface Point {
    x: number;
    y: number;
}