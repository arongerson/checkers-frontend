import { Component, OnInit } from '@angular/core';
import { StorageService } from '../../services/storage.service';
import { WebSocketsService } from '../../services/web-sockets.service';
import { ACTION_OTHER_JOINED, ACTION_RULE_UPDATED, ACTION_CONNECT } from '../../util/constants';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss']
})
export class LobbyComponent implements OnInit {

  isCreator = false;
  gameCode: string;
  opponentName: string;
  gameJoined = false;
  gameJoinedMessage: string;
  boardSize: any;

  constructor(
    private storage: StorageService,
    private socket: WebSocketsService
  ) { }

  ngOnInit() {
    // this.socket.connect();
    this.socket.onMessage(this.onMessage);
    this.isCreator = this.storage.isCreator();
    this.gameCode = this.storage.getGameCode();
    this.opponentName = this.storage.getOpponentName();
    this.boardSize = this.storage.getBoardSize();
  }

  onMessage = (data) => {
    console.log("data", data);
    let payLoad = JSON.parse(data.data);
    let code = parseInt(payLoad.code);
    if (code === ACTION_OTHER_JOINED) {
      this.processOtherJoined(payLoad.data);
    } else if (code === ACTION_RULE_UPDATED) {
      this.processRuleUpdate(payLoad);
    } else if (code === ACTION_CONNECT) {
      console.log(payLoad);
      this.storage.saveToken(payLoad.data);
    }
  }

  ruleUpdated(rules) {
    console.log(rules);
    this.socket.updateRules(rules);
  }

  processOtherJoined = (data) => {
    console.log("lobby other joined")
    console.log(data);
  }

  processRuleUpdate(data) {
    console.log(data);
  }

}
