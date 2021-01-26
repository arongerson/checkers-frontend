import { Injectable } from '@angular/core';
import { Chat } from '../model/interface';
import { CREATOR_ID } from '../util/constants';
import { Rule } from '../model/interface';

const TOKEN_KEY = "token";
const PLAYER_ID_KEY = "id";
const GAME_CREATED_KEY = "created";
const GAME_STARTED_KEY = "started";
const GAME_CODE_KEY = "gameCode";
const GAME_OVER_KEY = "over";
const UNREAD_KEY = "unread";
const OPPONENT_NAME_KEY = 'opponent_name';
const BOARD_SIZE_KEY = 'board_size';
const CHATS = "chats";
const RULES = 'rules';
const GAME_JOINED_KEY = 'game_joined';
const GAME_JOINED_MESSAGE_KEY = 'game_joined_message';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  gameState: any;

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
    let playerId = sessionStorage.getItem(PLAYER_ID_KEY);
    if (playerId) {
      return parseInt(playerId);
    }
    return null;
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

  saveNumberOfUnreadMessages(num: number) {
    sessionStorage.setItem(UNREAD_KEY, num.toString());
  }

  getNumberOfUnreadMessages() {
    let num = sessionStorage.getItem(UNREAD_KEY);
    if (num === null || num === undefined) {
      return 0;
    }
    return parseInt(num);
  }

  getSavedChats() {
    let chats = sessionStorage.getItem(CHATS);
    if (chats === null) {
      return [];
    }
    return JSON.parse(chats) as Chat[];
  }

  saveChat(chat: Chat) {
    let chats = this.getSavedChats();
    chats.push(chat);
    sessionStorage.setItem(CHATS, JSON.stringify(chats));
  }

  clearGame() {
    sessionStorage.clear();
  }

  isCreator() {
    let playerId = StorageService.getPlayerId();
    if (playerId === undefined || playerId === null) {
      return true;
    }
    return playerId === CREATOR_ID;
  }

  saveRules(rules: Rule[]) {
    sessionStorage.setItem(RULES, JSON.stringify(rules));
  }

  getRules(): Rule[] {
    let rules = sessionStorage.getItem(RULES);
    if (rules === undefined || rules === null) {
      return null;
    }
    return JSON.parse(rules) as Rule[];
  }

  saveBoardSize(boardSize: any) {
    sessionStorage.setItem(BOARD_SIZE_KEY, JSON.stringify(boardSize));
  }

  getBoardSize() {
    return sessionStorage.getItem(BOARD_SIZE_KEY);
  }

  saveOpponentName(opponentName: any) {
    sessionStorage.setItem(OPPONENT_NAME_KEY, JSON.stringify(opponentName));
  }

  getOpponentName() {
    return sessionStorage.getItem(OPPONENT_NAME_KEY);
  }

  saveGameJoinedMessage(message: string) {
    sessionStorage.setItem(GAME_JOINED_MESSAGE_KEY, message);
  }

  getGameJoinedMessage(): string {
    return sessionStorage.getItem(GAME_JOINED_MESSAGE_KEY);
  }

  saveGameJoined() {
    sessionStorage.setItem(GAME_JOINED_KEY, "1");
  }

  getGameJoined(): boolean {
    const value = sessionStorage.getItem(GAME_JOINED_KEY);
    return value === "1";
  }

}
