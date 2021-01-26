import { Component, OnInit, HostListener } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { BoardService } from '../../services/board.service';
import { UtilService } from '../../services/util.service';
import { WebSocketsService } from '../../services/web-sockets.service';
import { PieceMoveService } from '../../model/pieceMoveProcessor';
import { CanvasService } from '../../services/canvas.service';
import { VchatService } from '../../services/vchat.service';
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
  showChats = false;
  canvas: any;
  creatorName: string;
  joinerName: string;
  gameState: string;
  chat: string;
  numUnreadMessages: number = 0;
  unreadMessagesBadge: string = "";
  videoChatUuid: string;
  userVideo: any;
  partnerVideo: any;

  constructor(
    private _snackBar: MatSnackBar,
    private storage: StorageService,
    private board: BoardService,
    private socket: WebSocketsService,
    private canvasService: CanvasService,
    private vchatService: VchatService,
    private router: Router
  ) { }

  ngOnInit() {
    this.canvas = document.getElementById('canvas');
    this.userVideo = document.getElementById('userVideo');
    this.partnerVideo = document.getElementById('partnerVideo');
    this.canvasService.init(
      this.canvas, 
      this.isPieceMovableCallback,
      this.dragStartCallback, 
      this.dragCompletedCallback
    );
    PieceMoveService.snackbarCallback = this.openSnackBar;
    this.socket.onMessage(this.onMessage);
    this.socket.getGameState();
    this.numUnreadMessages = this.storage.getNumberOfUnreadMessages();
    this.updateUnreadBadge();
  }

  onMessage = (data) => {
    let payLoad = JSON.parse(data.data);
    let code = parseInt(payLoad.code);
    if (code === ACTION_CHAT) {
      this.processChat(payLoad.data);
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

  processChat(data) {
    let chatData = JSON.parse(data);
    this.chat = chatData.chat;
    this.numUnreadMessages++;
    this.storage.saveNumberOfUnreadMessages(this.numUnreadMessages);
    this.updateUnreadBadge();
  }

  updateUnreadBadge() {
    if (this.numUnreadMessages > 0) {
      this.unreadMessagesBadge = this.numUnreadMessages.toString();
    } else {
      this.unreadMessagesBadge = "";
    }
  }

  clearUnread() {
    this.numUnreadMessages = 0;
    this.storage.saveNumberOfUnreadMessages(0);
    this.updateUnreadBadge();
  }

  processPlay(data) {
    let playData = JSON.parse(data);
    let plays = JSON.parse(playData.plays);
    PieceMoveService.setFeedback("Your turn");
    this.board.updatePlay(plays, this.canvas);
  }

  processGameClosed() {
    this.gameTerminated = true;
    this.gameOver = false;
    this.storage.clearGame();
    this.router.navigate(['/']);
  }

  processOtherClosed() {
    this.gameTerminated = true;
    PieceMoveService.setFeedback("Your opponent left the game");
  }

  onState(data) {
    let gameState = JSON.parse(data);
    this.board.initBoard(gameState);
    this.creatorName = gameState.creator;
    this.joinerName = gameState.joiner;
    this.gameState = gameState.status; // misnomer
    this.gameOver = false;
    this.gameStarted = true;
    this.videoChatUuid = gameState.vchatUuid;
    const join = true;
    this.vchatService.initVideo(this.videoChatUuid, this.userVideo, this.partnerVideo, StorageService.getPlayerId(), join);
    this.processGameState();
  }

  processGameState = () => {
    let checkers = this.board.getCheckers();
    let boardSize = this.board.getBoardSize();
    this.storage.saveGameStarted();
    this.storage.clearGameOver();
    this.canvasService.updateCanvas(boardSize);
    this.canvas.innerHTML = "";
    for(let i = 0; i < checkers.length; i++) {
      let rowCheckers = checkers[i];
      for (let j = 0; j < rowCheckers.length; j++) {
        let checker = rowCheckers[j];
        let checkerElement = UtilService.getCheckerElement(this.canvas, i, j, boardSize);
        checker.element = checkerElement;
        this.canvas.appendChild(checkerElement);
        if (this.board.itemExists(checker.piece)) {
          let piece = checker.piece;
          let owner = piece.owner;
          let color = (owner.id === CREATOR_ID) ? CREATOR_COLOR : JOINER_COLOR;
          let pieceElement = 
            UtilService.getPieceElement(this.canvas, color, i, j, piece.type, boardSize);
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

  toggleChats() {
    this.showChats = !this.showChats;
  }

  restart() {
    this.socket.restartGame();
  }

  isPieceMovableCallback = (element) => {
    return this.board.isPieceMovable(element)
  }

  dragStartCallback = (target) => {
    this._snackBar.dismiss();
    PieceMoveService.clearFeedback();
    this.board.initMove();
    return this.board.getDraggedPiece(target);
  }

  dragCompletedCallback = (draggedPiece) => {
    let target = draggedPiece.element.firstChild.firstChild;
    PieceMoveService.processPieceMove(draggedPiece, this.board, this.canvas, target);
    if (this.board.getPlayCompleted()) {
      this.socket.sendPlayUpdate(this.board.getPlays());
    }
  }

  getOpponentName() {
    if (this.isCreator()) {
      return this.joinerName;
    }
    return this.creatorName;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    let checkers = this.board.getCheckers();
    if (checkers) {
      this.processGameState();
    }
  }

  openSnackBar = (message: string) => {
    this._snackBar.open(message, '', {
      duration: 5000,
    });
  }

  replay() {
    this.board.replay();
  }

  canReplay() {
    return this.board.canReplay;
  }

}
