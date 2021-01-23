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

export interface Chat {
    isYours: boolean;
    text: string;
}

export interface Rule {
    description: string;
    key: string;
    yesNo: boolean;
}

export interface Rules {
    rules: Rule[];
}