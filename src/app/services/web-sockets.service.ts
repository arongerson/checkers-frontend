import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { Play, Position} from '../model/interface';

import { StorageService } from './storage.service';

import {
  ACTION_CHAT, ACTION_CONNECT, ACTION_CREATE, ACTION_ERROR, ACTION_JOIN,
  ACTION_LEAVE, ACTION_LOGIN, ACTION_OTHER_CONNECT, ACTION_PLAY, ACTION_REGISTER,
  ACTION_RESTART, ACTION_INFO, ACTION_CLOSED, ACTION_STATE
} from '../util/constants';
import { on } from 'cluster';

const HOST = '192.168.0.11:8080';
// const HOST = 'ec2-18-222-195-4.us-east-2.compute.amazonaws.com:8080';

@Injectable({
  providedIn: 'root'
})
export class WebSocketsService {

  token: string;
  webSocket: any;
  onMessageCallback: Function;

  constructor(private storage: StorageService) { 
    this.connect();
  }

  connect() {
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

  initWebSocket() {
    this.token = this.storage.getToken();
    if ("WebSocket" in window) {
      return new WebSocket(`ws://${HOST}/Checkers/connect/${this.token}`);
    }
    throwError('web sockets not supported');
  }

  onOpen = (data) => {
    console.log('web-socket is open');
    this.getGameState();
  }

  onError = (e) => {
    console.log('error');
  }

  onClose = () => {
    console.log('closed connection');
    this.connect();
  }

  onMessage(onMessageCallback: Function) {
    this.onMessageCallback = onMessageCallback;
    if (this.webSocket) {
      this.webSocket.onmessage = onMessageCallback;
    }
  }

  createGame(playerName: string) {
    this.webSocket.send(JSON.stringify(
      {
        code: ACTION_CREATE,
        data: playerName
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
  }

  getGameState() {
    if (this.webSocket.readyState === WebSocket.OPEN) {
      console.log('getting the data');
      this.webSocket.send(JSON.stringify(
        {
          code: ACTION_STATE,
          data: ""
        }
      ));
    }
  }
}
