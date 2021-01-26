import { Component, OnInit, ViewChild } from '@angular/core';
import { StorageService } from '../../services/storage.service';
import { WebSocketsService } from '../../services/web-sockets.service';
import { ACTION_OTHER_JOINED, ACTION_RULE_UPDATED, ACTION_CONNECT } from '../../util/constants';
import { RulesComponent } from '../rules/rules.component';

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
  @ViewChild( RulesComponent, {static: false} ) rulesComponent: RulesComponent;

  constructor(
    private storage: StorageService,
    private socket: WebSocketsService
  ) { }

  ngOnInit() {
    this.socket.onMessage(this.onMessage);
    this.isCreator = this.storage.isCreator();
    this.gameCode = this.storage.getGameCode();
    this.opponentName = this.storage.getOpponentName();
    this.boardSize = this.storage.getBoardSize();
    this.gameJoined = this.storage.getGameJoined();
    this.gameJoinedMessage = this.storage.getGameJoinedMessage();
  }

  onMessage = (data) => {
    let payLoad = JSON.parse(data.data);
    let code = parseInt(payLoad.code);
    if (code === ACTION_OTHER_JOINED) {
      this.processOtherJoined(payLoad.data);
    } else if (code === ACTION_RULE_UPDATED) {
      this.processRuleUpdate(payLoad.data);
    } else if (code === ACTION_CONNECT) {
      this.storage.saveToken(payLoad.data);
    }
  }

  ruleUpdated(rules) {
    this.socket.updateRules(rules);
  }

  processOtherJoined = (data) => {
    const content = JSON.parse(data);
    this.gameJoined = true;
    this.gameJoinedMessage = content.info;
    this.storage.saveGameJoined();
    this.storage.saveGameJoinedMessage(content.info);
  }

  processRuleUpdate(data) {
    console.log(data);
    const content = JSON.parse(data);
    this.rulesComponent.updateRules(content.rules);
  }

}
