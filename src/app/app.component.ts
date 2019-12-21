import { Component, OnInit } from '@angular/core';
import { WebSocketsService } from './services/web-sockets.service';
import {
  ACTION_CHAT, ACTION_CONNECT, ACTION_CREATE, ACTION_ERROR, ACTION_JOIN,
  ACTION_LEAVE, ACTION_LOGIN, ACTION_OTHER_CONNECT, ACTION_PLAY, ACTION_REGISTER,
  ACTION_RESTART, ACTION_INFO
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
  }

}
