import { Component, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { WebSocketsService } from '../../services/web-sockets.service';
import { UtilService } from '../../services/util.service';
import { StorageService } from '../../services/storage.service';
import { ValidationService } from '../../services/validation.service';

import {
  ACTION_CHAT, ACTION_CONNECT, ACTION_CREATE, ACTION_ERROR, ACTION_JOIN,
  ACTION_LOGIN, ACTION_OTHER_CONNECT, ACTION_PLAY, ACTION_REGISTER,
  ACTION_RESTART, ACTION_INFO, ACTION_CLOSED, ACTION_OTHER_CLOSED, ACTION_STATE, ACTION_OVER, CREATOR_ID,
  CREATOR_COLOR, JOINER_COLOR, ACTION_OTHER_JOINED
} from '../../util/constants';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements OnInit, AfterViewInit {

  submitted = false;
  gameCreated = false;
  generatedCode: string;
  listenersAdded = false;
  yourColor: string;
  creatorColorClass: string = 'creator-color';

  canvas: any;

  createForm = new FormGroup({
    name: new FormControl('', this.validation.getNameValidators()),
    boardSize: new FormControl('8')
  });

  joinForm = new FormGroup({
    name: new FormControl('', this.validation.getNameValidators()),
    code: new FormControl('', this.validation.getCodeValidators())
  });

  constructor(
    private socketService: WebSocketsService,
    private storage: StorageService,
    private validation: ValidationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.init();
    this.socketService.connect();
    this.socketService.onMessage(this.onMessage);
  }

  init() {
    this.gameCreated = this.storage.initGameCreated();
    this.generatedCode = this.storage.getGameCode();
    this.listenersAdded = false;
  }

  ngAfterViewInit() {
    this.drawCheckers();
  }

  getErrorMessage(control) {
    return this.validation.getErrorMessage(control);
  }

  drawCheckers() {
    this.updateCheckers();
  }

  updateCheckers() {
    let element = document.getElementById('body');
    let firstChild = element.firstChild;
    element.innerHTML = '';
    element.appendChild(firstChild);
    let rect = element.getBoundingClientRect();
    let width = rect.width;
    let height = rect.height;
    let size = 4;
    for (let i = 0; i < Math.ceil(height/ size) + 1; i++) {
      for (let j = 0; j < Math.ceil(width/ size); j++) {
        let backgroundChecker = UtilService.getBackgroundChecker(i, j, width, height, size);
        element.appendChild(backgroundChecker);
      }
    }
  }

  onMessage = (data) => {
    console.log('on-message: ' + data.data);
    let payLoad = JSON.parse(data.data);
    let code = parseInt(payLoad.code);
    if (code === ACTION_CREATE) {
      this.processGameCreated(payLoad.data);
    } else if (code === ACTION_JOIN) {
      this.processGameJoined(payLoad.data);
    } else if (code === ACTION_CHAT) {
    } else if (code === ACTION_CONNECT) {
      this.storage.saveToken(payLoad.data);
    } else if (code === ACTION_ERROR) {
    } else if (code === ACTION_OTHER_JOINED) {
      this.processOtherJoined(payLoad.data);
    } else if (code === ACTION_OTHER_CONNECT) {
    } else if (code === ACTION_REGISTER) {
    } else if (code === ACTION_INFO) {
    } else if (code === ACTION_CLOSED) {
    } else {
    }
  }

  isCreator() {
    let playerId = StorageService.getPlayerId();
    return playerId === CREATOR_ID;
  }

  processGameCreated = (data) => {
    let content = JSON.parse(data);
    this.storage.saveGameCreated();
    this.generatedCode = content.gameCode;
    this.storage.saveGameCode(this.generatedCode);
    this.storage.savePlayerId(content.playerId);
    this.submitted = false;
    this.gameCreated = true;
  }

  processGameJoined = (data) => {
    let content = JSON.parse(data);
    this.storage.savePlayerId(content.playerId);
    this.submitted = false;
    this.router.navigate(['play']);
  }

  processOtherJoined = (data) => {
    this.router.navigate(['play']);
  }

  deleteGame() {

  }

  create() {
    this.submitted = true;
    let playerName = this.createForm.controls.name.value;
    let boardSize = this.createForm.controls.boardSize.value;
    this.socketService.createGame(playerName, boardSize);
  }

  join() {
    this.submitted = true;
    let joinerName = this.joinForm.controls.name.value;
    let gameCode = this.joinForm.controls.code.value;
    this.socketService.joinGame(joinerName, gameCode);
  }

  cancelGame() {

  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.updateCheckers();
  }
}