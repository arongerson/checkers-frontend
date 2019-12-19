import { Component, OnInit } from '@angular/core';
import { WebSocketsService } from './services/web-sockets.service';
import {
  ACTION_CHAT, ACTION_CONNECT, ACTION_CREATE, ACTION_ERROR, ACTION_JOIN,
  ACTION_LEAVE, ACTION_LOGIN, ACTION_OTHER_CONNECT, ACTION_PLAY, ACTION_REGISTER,
  ACTION_RESTART
} from './util/constants';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'checkers';

  webSocket: any;

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
      console.log('game created: ' + JSON.stringify(data.data));
    } else if (code === ACTION_JOIN) {
      console.log('game joined: ' + JSON.stringify(data.data));
    } else if (code === ACTION_CHAT) {
      console.log('game chat: ' + JSON.stringify(data.data));
    } else if (code === ACTION_CONNECT) {
      console.log('game connect: ' + JSON.stringify(data.data));
    } else if (code === ACTION_ERROR) {
      console.log('game error: ' + JSON.stringify(data.data));
    } else if (code === ACTION_LEAVE) {
      console.log('game leave: ' + JSON.stringify(data.data));
    } else if (code === ACTION_LOGIN) {
      console.log('game login: ' + JSON.stringify(data.data));
    } else if (code === ACTION_OTHER_CONNECT) {
      console.log('game other connect: ' + JSON.stringify(data.data));
    } else if (code === ACTION_PLAY) {
      console.log('game play: ' + JSON.stringify(data.data));
    } else if (code === ACTION_REGISTER) {
      console.log('game register: ' + JSON.stringify(data.data));
    } else {
      console.log('game unknown code: ' + JSON.stringify(data.data));
    }
  }

  onError = (e) => {
    console.log('error');
  }

  onClose = () => {
    console.log('closed connection');
  }

}
