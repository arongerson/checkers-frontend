import { Component, OnInit, HostListener } from '@angular/core';
import { StorageService } from '../../services/storage.service';
import { BoardService } from '../../services/board.service';
import { UtilService } from '../../services/util.service';
import { WebSocketsService } from '../../services/web-sockets.service';
import { PieceMoveService } from '../../model/pieceMoveProcessor';
import { DragEventService } from '../../services/drag-event.service';
import {
  ACTION_CHAT, ACTION_CONNECT, ACTION_CREATE, ACTION_ERROR, ACTION_JOIN,
  ACTION_LOGIN, ACTION_OTHER_CONNECT, ACTION_PLAY, ACTION_REGISTER,
  ACTION_RESTART, ACTION_INFO, ACTION_CLOSED, ACTION_OTHER_CLOSED, ACTION_STATE, ACTION_OVER, CREATOR_ID,
  CREATOR_COLOR, JOINER_COLOR
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
  listenersAdded = false;

  constructor(
    private storage: StorageService,
    private board: BoardService,
    private socket: WebSocketsService,
    private drag: DragEventService
  ) { }

  ngOnInit() {
    this.canvas = document.getElementById('canvas');
    this.drag.init(this.canvas);
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

  addEventListeners() {
    if (!this.listenersAdded) {
      // mouse listeners
      this.canvas.addEventListener('mousedown', this.drag.mouseDown, false);
      this.canvas.addEventListener('mousemove', this.drag.mouseMove, false);
      this.canvas.addEventListener('mouseup', this.drag.mouseUp, false);
      // touch listeners
      this.canvas.addEventListener('touchstart', this.drag.mouseDown, false);
      this.canvas.addEventListener('touchmove', this.drag.mouseMove, false);
      this.canvas.addEventListener('touchend', this.drag.mouseUp, false);
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
