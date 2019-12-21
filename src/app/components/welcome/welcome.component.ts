import { Component, OnInit } from '@angular/core';
import { WebSocketsService } from '../../services/web-sockets.service';
import {
  ACTION_CHAT, ACTION_CONNECT, ACTION_CREATE, ACTION_ERROR, ACTION_JOIN,
  ACTION_LEAVE, ACTION_LOGIN, ACTION_OTHER_CONNECT, ACTION_PLAY, ACTION_REGISTER,
  ACTION_RESTART, ACTION_INFO
} from '../../util/constants';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements OnInit {

  webSocket: any;
  joinName: string;
  gameCode: string;
  playerName: string;

  constructor(
    private socketService: WebSocketsService
  ) {}

  ngOnInit() {
    this.connect();
  }

  connect() {
    this.webSocket = this.socketService.initWebSocket();
    if (this.webSocket) {
      this.webSocket.onopen = this.onOpen;
      this.webSocket.onmessage = this.onMessage;
      this.webSocket.onerror = this.onError;
      this.webSocket.onclose = this.onClose;
    }
  }

  onOpen = (data) => {
    console.log('connected');
  }

  onMessage = (data) => {
    let payLoad = JSON.parse(data.data);
    let code = parseInt(payLoad.code);
    if (code === ACTION_RESTART) {
      console.log('game restarted: ' + JSON.stringify(data.data));
    } else if (code === ACTION_CREATE) {
      let content = JSON.parse(payLoad.data);
      console.log(JSON.stringify(content));
      console.log('game created: ' + JSON.stringify(content.gameCode));
      this.socketService.savePlayerId(content.playerId);
    } else if (code === ACTION_JOIN) {
      let content = JSON.parse(payLoad.data);
      console.log(JSON.stringify(content));
      console.log('game joined: ' + JSON.stringify(content.gameCode));
      this.socketService.savePlayerId(content.playerId);
    } else if (code === ACTION_CHAT) {
      console.log('game chat: ' + JSON.stringify(data.data));
    } else if (code === ACTION_CONNECT) {
      console.log('game connect: ' + JSON.stringify(data.data));
      this.socketService.saveToken(payLoad.data);
    } else if (code === ACTION_ERROR) {
      console.log('game error: ' + JSON.stringify(data.data));
    } else if (code === ACTION_LEAVE) {
      console.log('game leave: ' + JSON.stringify(data.data));
    } else if (code === ACTION_LOGIN) {
      console.log('game login: ' + JSON.stringify(data.data));
    } else if (code === ACTION_OTHER_CONNECT) {
      console.log('game other connect: ' + JSON.stringify(data.data));
    } else if (code === ACTION_PLAY) {
      let content = JSON.parse(payLoad.data);
      console.log(JSON.stringify(content))
    } else if (code === ACTION_REGISTER) {
      console.log('game register: ' + JSON.stringify(data.data));
    } else if (code === ACTION_INFO) {
      console.log('game info: ' + payLoad.data.info);
    } else {
      console.log('game unknown code: ' + JSON.stringify(data.data));
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
    gameCode = prompt("Game id: ");
    this.webSocket.send(JSON.stringify(
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

  onError = (e) => {
    console.log('error');
  }

  onClose = () => {
    console.log('closed connection');
  }

  create() {
    this.createGame(this.playerName);
  }

  join() {
    this.joinGame(this.playerName, this.gameCode);
  }

}

