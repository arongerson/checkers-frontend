import { Component, OnInit, HostListener } from '@angular/core';
import { StorageService } from '../../services/storage.service';
import { BoardService } from '../../services/board.service';
import { UtilService } from '../../services/util.service';
import { WebSocketsService } from '../../services/web-sockets.service';
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
  selector: 'app-play',
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.scss']
})
export class PlayComponent implements OnInit {

  gameOver = false;
  gameStarted = true;
  gameTerminated = false;
  canvas: any;
  initialX = 0;
  initialY = 0;
  currentX = 0;
  currentY = 0;
  offsetX = 0;
  offsetY = 0;
  draggedElement: any;
  draggedPiece: any;
  listenersAdded = false;

  constructor(
    private storage: StorageService,
    private board: BoardService,
    private socket: WebSocketsService
  ) { }

  ngOnInit() {
    this.canvas = document.getElementById('canvas');
    this.socket.onMessage(this.onMessage);
    this.socket.getGameState();
  }

  onMessage = (data) => {
    let payLoad = JSON.parse(data.data);
    let code = parseInt(payLoad.code);
    if (code === ACTION_CHAT) {
    } else if (code === ACTION_ERROR) {
    } else if (code === ACTION_CLOSED) {
      this.processGameClosed();
    } else if (code === ACTION_OTHER_CLOSED) {
      this.processOtherClosed();
    } else if (code === ACTION_OTHER_CONNECT) {
    } else if (code === ACTION_PLAY) {
      this.processPlay(payLoad.data);
    } else if (code === ACTION_STATE) {
      this.onState(payLoad.data);
    } else if (code === ACTION_OVER) {
      this.processGameOver(payLoad.data);
    } else if (code === ACTION_INFO) {
    }
  }

  processPlay(data) {
    let playData = JSON.parse(data);
    PieceMoveService.setFeedback("Your turn");
    this.board.updatePlay(playData, this.canvas);
  }

  processGameClosed() {
    this.gameTerminated = true;
    this.gameOver = false;
    this.storage.clearGame();
  }

  processOtherClosed() {
    this.gameTerminated = true;
    PieceMoveService.setFeedback("Your playmate left the game");
  }

  onState(data) {
    let gameState = JSON.parse(data);
    this.board.initBoard(gameState);
    this.gameOver = false;
    this.gameStarted = true;
    this.processGameState();
  }

  processGameState = () => {
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
    let rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.addEventListeners();
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
          this.socket.sendPlayUpdate(this.board.getPlays());
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

  inTurn() {
    return this.board.isInTurn();
  }

  getFeedback() {
    return PieceMoveService.getFeedback();
  }

  leave() {
    let confirm = window.confirm("You wont be able to access this game again. Are you sure?");
    if (confirm) {
      this.storage.clearGame();
      this.socket.leaveGame();
    }
  }

  restart() {
    this.socket.restartGame();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    let checkers = this.board.getCheckers();
    if (checkers) {
      this.processGameState();
    }
  }

}
