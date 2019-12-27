import { Component, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { WebSocketsService } from '../../services/web-sockets.service';
import { BoardService } from '../../services/board.service';
import { UtilService } from '../../services/util.service';
import { StorageService } from '../../services/storage.service';
import { PieceMoveProcessor } from '../../model/pieceMoveProcessor';

import {
  ACTION_CHAT, ACTION_CONNECT, ACTION_CREATE, ACTION_ERROR, ACTION_JOIN,
  ACTION_LEAVE, ACTION_LOGIN, ACTION_OTHER_CONNECT, ACTION_PLAY, ACTION_REGISTER,
  ACTION_RESTART, ACTION_INFO, ACTION_CLOSED, ACTION_STATE
} from '../../util/constants';

import {
  OFFSET_X_ATTR, 
  OFFSET_Y_ATTR,
  ROW_ATTRIBUTE,
  COL_ATTRIBUTE
} from '../../util/constants';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements OnInit, AfterViewInit {

  webSocket: any;
  joinName: string;
  gameCode: string;
  playerName: string;

  buttonDisabled = false;
  gameCreated = false;
  gameStarted = false;
  generatedCode: string;

  listenersAdded = false;

  // playData = null;
  canvas: any;

  initialX = 0;
  initialY = 0;
  currentX = 0;
  currentY = 0;
  offsetX = 0;
  offsetY = 0;
  draggedElement: any;
  draggedPiece: any;

  constructor(
    private socketService: WebSocketsService,
    private board: BoardService,
    private storage: StorageService,
    private router: Router
  ) {}

  ngOnInit() {
    this.gameCreated = this.storage.initGameCreated();
    this.gameStarted = this.storage.initGameStarted();
    this.generatedCode = this.storage.getGameCode();
    this.connect();
  }

  ngAfterViewInit() {
    if (!this.gameStarted) {
      this.drawCheckers();
    }
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
      this.processGameCreated(payLoad.data);
    } else if (code === ACTION_JOIN) {
      this.processGameJoined(payLoad.data);
    } else if (code === ACTION_CHAT) {
      console.log('game chat: ' + JSON.stringify(data.data));
    } else if (code === ACTION_CONNECT) {
      console.log('game connect: ' + JSON.stringify(data.data));
      this.storage.saveToken(payLoad.data);
    } else if (code === ACTION_ERROR) {
      console.log('game error: ' + JSON.stringify(data.data));
    } else if (code === ACTION_LEAVE) {
      console.log('game leave: ' + JSON.stringify(data.data));
    } else if (code === ACTION_LOGIN) {
      console.log('game login: ' + JSON.stringify(data.data));
    } else if (code === ACTION_OTHER_CONNECT) {
      console.log('game other connect: ' + JSON.stringify(data.data));
    } else if (code === ACTION_PLAY) {
      let playData = JSON.parse(payLoad.data);
      // console.log(JSON.stringify(playData));
      this.board.updatePlay(playData, this.canvas);
    } else if (code === ACTION_STATE) {
      let gameState = JSON.parse(payLoad.data);
      this.board.initBoard(gameState);
      this.processPlay();
    }  else if (code === ACTION_REGISTER) {
      console.log('game register: ' + JSON.stringify(data.data));
    } else if (code === ACTION_INFO) {
      console.log('game info: ' + payLoad.data.info);
    } else if (code === ACTION_CLOSED) {
      console.log('game info: ' + payLoad.data.info);
    } else {
      console.log('game unknown code: ' + JSON.stringify(data.data));
    }
  }

  mouseDown = (e) => {
    if (this.isDraggable(e.target)) {
      this.board.initMove();
      this.draggedElement = e.target;
      this.draggedPiece = this.board.getDraggedPiece(this.draggedElement);
      this.draggedPiece.element.style.zIndex = '20';
      if (e.type === "touchstart") {
        this.initialX = e.touches[0].clientX - parseFloat(this.draggedElement.getAttribute(OFFSET_X_ATTR));
        this.initialY = e.touches[0].clientY - parseFloat(this.draggedElement.getAttribute(OFFSET_Y_ATTR));
      } else {
        this.initialX = e.clientX - parseFloat(this.draggedElement.getAttribute(OFFSET_X_ATTR));
        this.initialY = e.clientY - parseFloat(this.draggedElement.getAttribute(OFFSET_Y_ATTR));
      }
    }
  }

  mouseMove = (e) => {
    if (this.draggedElement !== undefined && this.draggedElement !== null) {
      e.preventDefault();
      if (e.type === "touchmove") {
          this.currentX = e.touches[0].clientX - this.initialX;
          this.currentY = e.touches[0].clientY - this.initialY;
      } else {
          this.currentX = e.clientX - this.initialX;
          this.currentY = e.clientY - this.initialY;
      }
      this.offsetX = this.currentX;
      this.offsetY = this.currentY;
      this.draggedElement.setAttribute(OFFSET_X_ATTR, this.currentX.toString());
      this.draggedElement.setAttribute(OFFSET_Y_ATTR, this.currentY.toString());
      this.setTranslate(this.currentX, this.currentY, this.draggedElement);
    }
  }

  mouseUp = (e) => {
    if (this.draggedElement !== undefined && this.draggedElement !== null) {
        this.initialX = this.currentX;
        this.initialY = this.currentY;
        PieceMoveProcessor.processPieceMove(this.draggedPiece, this.board, this.canvas, e.target);
        this.draggedElement = null;
        this.draggedPiece.element.style.zIndex = '10';
        this.draggedPiece = null;
        if (this.board.getPlayCompleted()) {
          this.socketService.sendPlayUpdate(this.webSocket, this.board.getPlays());
        }
    }
  } 

  setTranslate(xPos, yPos, element) {
    if (this.draggedElement) {
        this.draggedPiece.element.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
    }
  }

  isDraggable(element) {
    return this.isPiece(element) && this.board.isPieceMovable(element);
  }

  isPiece(element) {
    let index = element.getAttribute(ROW_ATTRIBUTE);
    return index !== null;
  }

  addEventListeners() {
    if (!this.listenersAdded) {
      // mouse listeners
      this.canvas.addEventListener('mousedown', this.mouseDown, false);
      this.canvas.addEventListener('mousemove', this.mouseMove, false);
      this.canvas.addEventListener('mouseup', this.mouseUp, false);
      // touch listeners
      this.canvas.addEventListener('touchstart', this.mouseDown, false);
      this.canvas.addEventListener('touchmove', this.mouseMove, false);
      this.canvas.addEventListener('touchend', this.mouseUp, false);
      this.listenersAdded = true;
    }
  }

  processPlay = () => {
    let checkers = this.board.getCheckers();
    // console.log(JSON.stringify(checkers))
    this.storage.saveGameStarted();
    this.gameStarted = true;
    this.initCanvas();
    this.initCanvasSizeAndStartPositions();
    this.canvas.innerHTML = "";
    for(let i = 0; i < checkers.length; i++) {
      let rowCheckers = checkers[i];
      for (let j = 0; j < rowCheckers.length; j++) {
        let checker = rowCheckers[j];
        let checkerElement = UtilService.getCheckerElement(this.canvas, i, j);
        checker.element = checkerElement;
        this.canvas.appendChild(checkerElement);
        if (this.board.itemExists(checker.piece)) {
          let piece = checker.piece;
          let owner = piece.owner;
          let color = (owner.id === 1) ? 'crimson' : 'black';
          let pieceElement = UtilService.getPieceElement(this.canvas, color, i, j, piece.type);
          piece.element = pieceElement;
          this.canvas.appendChild(pieceElement);
        }
      }
    }
  }

  initCanvasSizeAndStartPositions = () => {
    this.canvas.startX = 0;
    this.canvas.startY = 0;
    if (this.canvas.width < this.canvas.height) {
      this.canvas.startY = (this.canvas.height - this.canvas.width) / 2;
      this.canvas.size = this.canvas.width / 8;
    } else {
      this.canvas.startX = (this.canvas.width - this.canvas.height) / 2;
      this.canvas.size = this.canvas.height/8;
    }
  }

  initCanvas = () => {
    this.canvas = document.getElementById('canvas');
    let rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.addEventListeners();
  }

  getWidthAndHeight = () => {
    
  }

  updateView = (data) => {

  }

  processGameCreated = (data) => {
    let content = JSON.parse(data);
    this.storage.saveGameCreated();
    this.generatedCode = content.gameCode;
    this.storage.saveGameCode(this.generatedCode);
    this.storage.savePlayerId(content.playerId);
    this.buttonDisabled = false;
    this.gameCreated = true;
  }

  processGameJoined = (data) => {
    let content = JSON.parse(data);
    this.storage.savePlayerId(content.playerId);
    this.buttonDisabled = false;
    this.gameStarted = true;
  }

  deleteGame() {

  }

  onError = (e) => {
    console.log('error');
  }

  onClose = () => {
    console.log('closed connection');
  }

  create() {
    this.buttonDisabled = true;
    this.socketService.createGame(this.webSocket, this.playerName);
  }

  join() {
    this.buttonDisabled = true;
    this.socketService.joinGame(this.webSocket, this.joinName, this.gameCode);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    if (!this.gameStarted) {
      this.updateCheckers();
    }
    let checkers = this.board.getCheckers();
    if (checkers) {
      this.processPlay();
    }
  }

}