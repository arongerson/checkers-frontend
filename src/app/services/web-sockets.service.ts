import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { Play, Position} from '../model/interface';

import { StorageService } from './storage.service';

import {
  HOST, ACTION_CHAT, ACTION_CONNECT, ACTION_CREATE, ACTION_ERROR, ACTION_JOIN,
  ACTION_LEAVE, ACTION_LOGIN, ACTION_OTHER_CONNECT, ACTION_PLAY, ACTION_REGISTER,
  ACTION_RESTART, ACTION_INFO, ACTION_CLOSED, ACTION_STATE
} from '../util/constants';
import { on } from 'cluster';

@Injectable({
  providedIn: 'root'
})
export class WebSocketsService {

  token: string;
  webSocket: any;
  closed = true;
  onMessageCallback: Function;

  constructor(private storage: StorageService) { 
    this.connect();
  }

  connect() {
    if (this.closed) {
      this.closed = false;
      this.webSocket = this.initWebSocket();
      if (this.webSocket) {
        this.webSocket.onopen = this.onOpen;
        this.webSocket.onerror = this.onError;
        this.webSocket.onclose = this.onClose;
        if (this.onMessageCallback) {
          this.webSocket.onMessage = this.onMessageCallback;
        }
      }
    }
  }

  initWebSocket() {
    this.token = this.storage.getToken();
    if ("WebSocket" in window) {
      return new WebSocket(`wss://${HOST}/Checkers/connect/${this.token}`);
    }
    throwError('web sockets not supported');
  }

  onOpen = (data) => {
    this.getGameState();
  }

  onError = (e) => {
    console.log('error');
  }

  onClose = () => {
    console.log('closed connection');
  }

  onMessage(onMessageCallback: Function) {
    this.onMessageCallback = onMessageCallback;
    if (this.webSocket) {
      this.webSocket.onmessage = onMessageCallback;
    }
  }

  createGame(playerName: string, boardSize) {
    this.webSocket.send(JSON.stringify(
      {
        code: ACTION_CREATE,
        data: JSON.stringify(
          {
            name: playerName,
            boardSize: boardSize
          }
        )
      }
    ));
  }

  joinGame(playerName: string, gameCode: string) {
   this. webSocket.send(JSON.stringify(
      {
        code: ACTION_JOIN,
        data: JSON.stringify(
          {
            name: playerName,
            code: gameCode
          }
        )
      }
    ));
  }

  sendPlayUpdate(plays: Play[]) {
    this.webSocket.send(JSON.stringify(
      {
        code: ACTION_PLAY,
        data: JSON.stringify(plays)
      }
    ));
  }

  restartGame() {
    this.webSocket.send(JSON.stringify(
      {
        code: ACTION_RESTART,
        data: ""
      }
    ));
  }

  leaveGame() {
    this.webSocket.send(JSON.stringify(
      {
        code: ACTION_LEAVE,
        data: ""
      }
    ));
    this.closed = true;
  }

  getGameState() {
    if (this.webSocket.readyState === WebSocket.OPEN) {
      this.webSocket.send(JSON.stringify(
        {
          code: ACTION_STATE,
          data: ""
        }
      ));
    }
  }

  sendChat(text) {
    this.webSocket.send(JSON.stringify(
      {
        code: ACTION_CHAT,
        data: text
      }
    ));
  }
}
