import { Component, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { WebSocketsService } from '../../services/web-sockets.service';
import { BoardService } from '../../services/board.service';
import { UtilService } from '../../services/util.service';
import { StorageService } from '../../services/storage.service';
import { PieceMoveService } from '../../model/pieceMoveProcessor';

import {
  ACTION_CHAT, ACTION_CONNECT, ACTION_CREATE, ACTION_ERROR, ACTION_JOIN,
  ACTION_LOGIN, ACTION_OTHER_CONNECT, ACTION_PLAY, ACTION_REGISTER,
  ACTION_RESTART, ACTION_INFO, ACTION_CLOSED, ACTION_OTHER_CLOSED, ACTION_STATE, ACTION_OVER, CREATOR_ID,
  CREATOR_COLOR, JOINER_COLOR
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
  gameOver = false;
  gameTerminated = false;
  generatedCode: string;
  listenersAdded = false;
  yourColor: string;
  creatorColorClass: string = 'creator-color';

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
    this.init();
  }

  init() {
    this.gameCreated = this.storage.initGameCreated();
    this.gameStarted = this.storage.initGameStarted();
    this.generatedCode = this.storage.getGameCode();
    this.gameOver = this.storage.initGameOver();
    this.listenersAdded = false;
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
  }

  onMessage = (data) => {
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
    } else if (code === ACTION_CLOSED) {
      this.gameTerminated = true;
      this.gameCreated = false;
      this.gameStarted = false;
      this.gameOver = false;
      this.storage.clearGame();
      this.init();
    } else if (code === ACTION_OTHER_CLOSED) {
      this.gameTerminated = true;
      PieceMoveService.setFeedback("Your playmate left the game");
    } else if (code === ACTION_LOGIN) {
    } else if (code === ACTION_OTHER_CONNECT) {
    } else if (code === ACTION_PLAY) {
      let playData = JSON.parse(payLoad.data);
      PieceMoveService.setFeedback("Your turn");
      this.board.updatePlay(playData, this.canvas);
    } else if (code === ACTION_STATE) {
      let gameState = JSON.parse(payLoad.data);
      this.board.initBoard(gameState);
      this.gameOver = false;
      this.gameStarted = true;
      setTimeout(()=> {
        this.processPlay();
      }, 500);
    } else if (code === ACTION_OVER) {
      this.processGameOver(payLoad.data);
    }  else if (code === ACTION_REGISTER) {
    } else if (code === ACTION_INFO) {
    } else if (code === ACTION_CLOSED) {
    } else {
    }
  }

  mouseDown = (e) => {
    if (this.isDraggable(e.target)) {
      PieceMoveService.clearFeedback();
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
        PieceMoveService.processPieceMove(this.draggedPiece, this.board, this.canvas, e.target);
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

  isCreator() {
    let playerId = StorageService.getPlayerId();
    return playerId === CREATOR_ID;
  }

  processPlay = () => {
    let checkers = this.board.getCheckers();
    this.storage.saveGameStarted();
    this.storage.clearGameOver();
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
          let color = (owner.id === CREATOR_ID) ? CREATOR_COLOR : JOINER_COLOR;
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

  processGameCreated = (data) => {
    let content = JSON.parse(data);
    this.storage.saveGameCreated();
    this.generatedCode = content.gameCode;
    this.storage.saveGameCode(this.generatedCode);
    this.storage.savePlayerId(content.playerId);
    this.buttonDisabled = false;
    this.gameCreated = true;
  }

  processGameOver(data) {
    this.gameOver = true;
    this.storage.saveGameOver();
    let game = JSON.parse(data);
    let winnerId = game.winnerId;
    let playerId = StorageService.getPlayerId();
    if (winnerId === playerId) {
      PieceMoveService.setFeedback("You won!");
    } else {
      PieceMoveService.setFeedback("You lost!");
    }
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

  leave() {
    let confirm = window.confirm("You wont be able to access this game again. Are you sure?");
    if (confirm) {
      this.storage.clearGame();
      this.buttonDisabled = false;
      this.gameCreated = false;
      this.gameStarted = false;
      this.socketService.leaveGame(this.webSocket);
    }
  }

  inTurn() {
    return this.board.isInTurn();
  }

  restart() {
    this.socketService.restartGame(this.webSocket);
  }

  getFeedback() {
    return PieceMoveService.getFeedback();
  }

  cancelGame() {
    
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