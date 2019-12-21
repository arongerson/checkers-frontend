import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';

const HOST = '192.168.0.11:8080';
const TOKEN_KEY = "token";
const PLAYER_ID_KEY = "id";

@Injectable({
  providedIn: 'root'
})
export class WebSocketsService {

  token: string;

  constructor() { 
  }

  getToken() {
    let token = sessionStorage.getItem(TOKEN_KEY);
    return token === null ? '-1' : token;
  }

  initWebSocket() {
    this.token = this.getToken();
    if ("WebSocket" in window) {
      return new WebSocket(`ws://${HOST}/Checkers/connect/${this.token}`);
    }
    throwError('web sockets not supported');
  }

  saveToken(token: string) {
    this.token = token;
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  savePlayerId(id: number) {
    sessionStorage.setItem(PLAYER_ID_KEY, id.toString());
  }

  getPlayerId(): number {
    return parseInt(sessionStorage.getItem(PLAYER_ID_KEY));
  }
}
