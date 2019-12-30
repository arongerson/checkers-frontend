import { Injectable } from '@angular/core';

const TOKEN_KEY = "token";
const PLAYER_ID_KEY = "id";
const GAME_CREATED_KEY = "created";
const GAME_STARTED_KEY = "started";
const GAME_CODE_KEY = "gameCode";
const GAME_OVER_KEY = "over";

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() { }

  getToken() {
    let token = sessionStorage.getItem(TOKEN_KEY);
    return token === null ? '-1' : token;
  }

  saveToken(token: string) {
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  savePlayerId(id: number) {
    sessionStorage.setItem(PLAYER_ID_KEY, id.toString());
  }

  static getPlayerId(): number {
    return parseInt(sessionStorage.getItem(PLAYER_ID_KEY));
  }

  clearToken() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(PLAYER_ID_KEY);
  }

  clearGameStarted() {
    sessionStorage.removeItem(GAME_STARTED_KEY);
  }

  clearGameCreated() {
    sessionStorage.removeItem(GAME_CREATED_KEY);
  }

  clearGameOver() {
    sessionStorage.removeItem(GAME_OVER_KEY);
  }

  saveGameCreated() {
    sessionStorage.setItem(GAME_CREATED_KEY, "created");
  }

  saveGameStarted() {
    sessionStorage.setItem(GAME_STARTED_KEY, "started");
  }

  saveGameOver() {
    sessionStorage.setItem(GAME_OVER_KEY, "over");
  }


  initGameCreated() {
    return sessionStorage.getItem(GAME_CREATED_KEY) !== null;
  }

  initGameStarted() {
    return sessionStorage.getItem(GAME_STARTED_KEY) !== null;
  }

  initGameOver() {
    return sessionStorage.getItem(GAME_OVER_KEY) !== null;
  }

  saveGameCode(gameCode) {
    sessionStorage.setItem(GAME_CODE_KEY, gameCode);
  }

  getGameCode() {
    let code = sessionStorage.getItem(GAME_CODE_KEY);
    return code;
  }

  clearGame() {
    sessionStorage.clear();
  }
}
