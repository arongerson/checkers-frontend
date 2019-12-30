import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { Play, Position} from '../model/interface';

import { StorageService } from './storage.service';

import {
  ACTION_CHAT, ACTION_CONNECT, ACTION_CREATE, ACTION_ERROR, ACTION_JOIN,
  ACTION_LEAVE, ACTION_LOGIN, ACTION_OTHER_CONNECT, ACTION_PLAY, ACTION_REGISTER,
  ACTION_RESTART, ACTION_INFO, ACTION_CLOSED
} from '../util/constants';

// const HOST = '192.168.0.11:8080';
const HOST = 'ec2-18-222-195-4.us-east-2.compute.amazonaws.com:8080';

@Injectable({
  providedIn: 'root'
})
export class WebSocketsService {

  token: string;

  constructor(private storage: StorageService) { 
  }

  initWebSocket() {
    this.token = this.storage.getToken();
    if ("WebSocket" in window) {
      return new WebSocket(`ws://${HOST}/Checkers/connect/${this.token}`);
    }
    throwError('web sockets not supported');
  }

  createGame(webSocket, playerName: string) {
    webSocket.send(JSON.stringify(
      {
        code: ACTION_CREATE,
        data: playerName
      }
    ));
  }

  joinGame(webSocket, playerName: string, gameCode: string) {
    webSocket.send(JSON.stringify(
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

  sendPlayUpdate(webSocket, plays: Play[]) {
    console.log(JSON.stringify(plays));
    webSocket.send(JSON.stringify(
      {
        code: ACTION_PLAY,
        data: JSON.stringify(plays)
      }
    ));
  }

  restartGame(webSocket) {
    webSocket.send(JSON.stringify(
      {
        code: ACTION_RESTART,
        data: ""
      }
    ));
  }

  leaveGame(webSocket) {
    webSocket.send(JSON.stringify(
      {
        code: ACTION_LEAVE,
        data: ""
      }
    ));
  }
}
