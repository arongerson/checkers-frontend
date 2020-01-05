import { Injectable } from '@angular/core';

import { StorageService } from './storage.service';
import { UtilService } from './util.service'; 
import { SoundService } from './sound.service';
import { CREATOR_ID, JOINER_ID } from '../util/constants';
import { Play, Point} from '../model/interface';

import {
  OFFSET_X_ATTR, 
  OFFSET_Y_ATTR,
  ROW_ATTRIBUTE,
  COL_ATTRIBUTE,
  PIECE_EDGE_OFFSET,
  TYPE_KING,
  TYPE_NORMAL,
  ANIMATION_TIME,
  ANIMATION_DELAY
} from '../util/constants';
import { $$ } from 'protractor';
import { runInThisContext } from 'vm';

@Injectable({
  providedIn: 'root'
})
export class BoardService {

  private checkers: any;
  private playerInTurn: number; // the id of the player who is in turn
  private playerId: number;
  private hasCaptured = false;
  private hasCapturedDuringMove = false;
  private boardSize: number;
  // this is set after the first successful move during the turn
  // it is checked for further moves to prevent un-played pieces from being dragged
  private draggedPiece;
  private captured = [];
  // calculated at the beginning of the turn to determine the number of pieces that should be
  // captured
  private numberOfPiecesToBeCaptured: number; 
  private plays: Play[] = [];
  private playCompleted = false;
  // original row and column before the piece is moved
  private row: number;
  private col: number;

  constructor(private sound: SoundService) {
  }

  /**
   * 
   * @param playData called once when the board is created
   */
  public initBoard(gameState) {
    this.checkers = gameState.checkers;
    this.playerInTurn = gameState.turn;
    this.boardSize = gameState.boardSize;
    this.playerId = StorageService.getPlayerId();
    this.setRowAndColToPieces();
    if (this.isPlayerInTurn()) {
      this.initTurn();
    }
  }

  private setRowAndColToPieces() {
    for (let rowCheckers of this.checkers) {
      for (let checker of rowCheckers) {
        if (checker.hasOwnProperty('piece')) {
          checker.piece.row = checker.row;
          checker.piece.col = checker.column;
        } else {
          checker.piece = null;
        }
      }
    }
  }

  public updatePlay(data, canvas) {
    let playsText = data.plays;
    let plays = JSON.parse(playsText);
    let n = plays.length;
    for (let i = 0; i < plays.length; i++) {
      let play = plays[i];
      let from = play.from;
      let to = play.to;
      let fromChecker = this.checkers[from.row][from.col];
      let toChecker = this.checkers[to.row][to.col];
      let piece = fromChecker.piece;
      toChecker.piece = piece;
      piece.row = to.row;
      piece.col = to.col;
      fromChecker.piece = null;

      let fromPoint = UtilService.getElementPoint(fromChecker.element);
      let toPoint = UtilService.getElementPoint(toChecker.element);
      setTimeout(() => {
        this.sound.playSwoop();
        UtilService.animate(piece, fromPoint, toPoint);
        UtilService.positionElementOnTheBoard(piece, canvas, this.boardSize);
        let circle = piece.element.firstChild.firstChild;
        UtilService.setCircleAttributes(circle, to.row, to.col, 0, 0);
        this.removeCapturedPiece(play.captured);
      }, i*ANIMATION_TIME + (i + 1) * ANIMATION_DELAY);
    }
    setTimeout(() => {
      this.updateTypeIfKing(plays);
      this.playerInTurn = -this.playerInTurn;
      this.initTurn();
    }, n*ANIMATION_TIME + (n + 1) * ANIMATION_DELAY);
  }

  private removeCapturedPiece(captured) {
    if (captured !== null) {
      setTimeout(() => {
        this.sound.playCapture();
        let cPiece = this.checkers[captured.row][captured.col].piece;
        this.checkers[captured.row][captured.col].piece = null;
        cPiece.element.parentNode.removeChild(cPiece.element);
      }, 500);
    }
  }

  public getNumberToBeCaptured() {
    return this.numberOfPiecesToBeCaptured;
  }

  updateTypeIfKing(plays) {
    let lastPlay = plays.pop();
    let to = lastPlay.to;
    let piece = this.checkers[to.row][to.col].piece;
    if (this.isPieceAtLastRow(piece)) {
      piece.type = TYPE_KING;
      UtilService.setKingCircle(piece);
    }
  }

  /**
   * called once when the player is in turn
   */
  public initTurn() {
    this.restoreCapturedPiecesOwnership();
    this.hasCaptured = false;
    this.draggedPiece = null;
    this.captured = [];
    this.plays = [];
    this.playCompleted = false;
    this.calculateMaxNumberOfPiecesToBeCaptured();
  }

  /**
   * called at the beginning of every move
   */
  public initMove() {
    this.hasCapturedDuringMove = false;
  }

  public setDraggedPiece(piece) {
    this.draggedPiece = piece;
  }

  public updatePlayerInTurn(playerInTurn: number) {
    this.playerInTurn = playerInTurn;
  }

  public getPlays(): Play[] {
    return this.plays;
  }

  public getPlayCompleted() {
    return this.playCompleted;
  }

  public  getCheckers() {
    return this.checkers;
  }

  public getChecker(row, col) {
    return this.checkers[row][col];
  }

  public getBoardSize() {
    return this.boardSize;
  }

  public isInTurn() {
    return this.playerId === this.playerInTurn;
  }

  public hasCapturedAll() {
    return this.captured.length === this.numberOfPiecesToBeCaptured;
  }

  public saveCapturePlay(from, to) {
    let lastCaptured = this.getLastPieceCaptured();
    this.plays.push({
      from: {row: from[0], col: from[1]},
      to: {row: to[0], col: to[1]},
      captured: {row: lastCaptured.row, col: lastCaptured.col}
    });
  }

  public saveMovePlay(from, to) {
    this.plays.push({
      from: {row: from[0], col: from[1]},
      to: {row: to[0], col: to[1]},
      captured: null
    });
  }

  public getDraggedPiece(draggedElement) {
    let row = draggedElement.getAttribute(ROW_ATTRIBUTE);
    let col = draggedElement.getAttribute(COL_ATTRIBUTE);
    let piece = this.getPiece(row, col);
    return piece;
  }

  public getPiece(row: number, col: number) {
    return this.checkers[row][col].piece;
  }

  public notSameChecker(checker, target) {
    let targetRow = parseInt(target.getAttribute(ROW_ATTRIBUTE));
    let targetCol = parseInt(target.getAttribute(COL_ATTRIBUTE));
    return checker.row !== targetRow || checker.column !== targetCol;
  }

  public getLandingChecker(element, size) {
    let leftTop = this.getLeftTopSize(element);
    for (let rowCheckers of this.checkers) {
      for (let checker of rowCheckers) {
        if (this.isPlayableChecker(checker.row, checker.column)) {
          let checkerLeftTop = this.getLeftTopSize(checker.element);
          if (this.isLandingChecker(leftTop, checkerLeftTop, size)) {
            return checker;
          }
        }
      }
    }
    return null;
  }

  public isPlayableChecker(row, col) {
    return (row + col) % 2 === 1;
  }

  public didCapture() {
    return this.hasCaptured;
  }

  public isLandingChecker(draggedElementCoords, checkerCoords, size) {
    let xDiff = Math.abs(draggedElementCoords[0] - checkerCoords[0]);
    let yDiff = Math.abs(draggedElementCoords[1] - checkerCoords[1]);
    if (xDiff < size && yDiff < size) {
      let overlappingArea = (size - xDiff) * (size - yDiff);
      // if the area is atleast 70% of the checker the move is acceptable
      return overlappingArea >= 0.7 * size * size;
    }
    return false;
  }

  public getLeftTopSize(element) {
    let rect = element.getBoundingClientRect();
    return [rect.left, rect.top];
  }

  /** 
   * English rules:
   * the piece is movable if:
   * 1. No should capture somewhere else
   * 2. The player is in turn
   * 3. The piece belongs to the player
   * 4. The piece in the surrounding diagonals belongs to the 
   *    opposition and the space next to it is empty
   * 5. If the piece is ordinary:
   *    i. At least one forward diagoal is empty
   * 6. If the piece is King:
   *    i. The space in the surrounding diagonal is empty
   * 7. If further capture, restrict movement to the piece that was played first
   */
  public isPieceMovable(pieceElement) {
    let piece = this.getDraggedPiece(pieceElement);
    return this.isPlayerInTurn()
        && this.playerOwnsPiece(piece)
        && (this.canCapture(this.isKing(piece), piece.row, piece.col) || !this.shouldCapture())
        && (
           this.hasEmptyForwardChecker(piece) ||
           this.isKingAndHasEmptyBackwardChecker(piece) ||
           this.canCapture(this.isKing(piece), piece.row, piece.col)
        )
        && !this.isDifferentPiece(piece);
  }

  /**
   * switch turn
   * check crowning
   */
  public finalizePieceMove(draggedPiece) {
    this.playerInTurn = -this.playerInTurn;
    this.processTypeChange(draggedPiece);
    this.removeCapturedPiecesFromBoard();
    this.restoreCapturedPiecesOwnership();
    this.playCompleted = true;
  }

  private processTypeChange(piece) {
    if (!this.isKing(piece) && this.isPieceAtLastRow(piece)) {
      piece.type = TYPE_KING;
      UtilService.setKingCircle(piece);
    }
  }

  private removeCapturedPiecesFromBoard() {
    for (let piece of this.captured) {
      this.removePieceFromChecker(piece);
      piece.element.parentNode.removeChild(piece.element);
    }
  }

  /**
   * 
   * @param piece the piece being dragged
   */
  private isDifferentPiece(piece) {
    return this.itemExists(this.draggedPiece) && this.draggedPiece !== piece;
  }

  public isValidMove(movedPiece, landingChecker) {
    if (this.isKing(movedPiece)) {
      return this.isValidKingPlay(movedPiece, landingChecker);
    }
    return this.isValidOrdinaryPlay(movedPiece, landingChecker);
  }

  private isValidKingPlay(movedPiece, landingChecker) {
    let pieceRowCol = [movedPiece.row, movedPiece.col];
    let checkerRowCol = [landingChecker.row, landingChecker.column];
    if (this.isInDiagonal(pieceRowCol, checkerRowCol)) {
      let piecesBetween = this.getPiecesBetweenPath(pieceRowCol, checkerRowCol);
      return !this.itemExists(landingChecker.piece) &&
           this.isInDiagonal(pieceRowCol, checkerRowCol) &&
           (
             this.isValidKingMove(piecesBetween) ||
             this.isValidKingCapture(piecesBetween)
           ) &&
           this.hasObeyedCapturingRules();
    }
    return false;
  }

  private isValidKingMove(piecesBetween) {
    return piecesBetween.length === 0;
  }

  private isValidKingCapture(piecesBetween) {
    this.hasCapturedDuringMove = piecesBetween.length === 1 && !this.playerOwnsPiece(piecesBetween[0]);
    if (this.hasCapturedDuringMove) {
      this.hasCaptured = true;
      this.processCapturedPiece(piecesBetween[0]);
    }
    return this.hasCapturedDuringMove;
  }

  private getPiecesBetweenPath(pos1, pos2) {
    let rowTraverse = pos2[0] - pos1[0] < 0 ? -1 : 1;
    let colTraverse = pos2[1] - pos1[1] < 0 ? -1 : 1;
    let row = pos1[0] + rowTraverse;
    let col = pos1[1] + colTraverse;
    let numOfCheckersBetween = Math.abs(pos2[0] - pos1[0]) - 1;
    let pieces = [];
    for (let i = 0; i < numOfCheckersBetween; i++) {
      let piece = this.checkers[row][col].piece;
      if (this.itemExists(piece)) {
        pieces.push(piece);
      }
      row = row + rowTraverse;
      col = col + colTraverse;
    }
    return pieces;
  }

  public updatePlayingPieceAfterMove(draggedPiece, checker) {
    this.saveFirstPosition(draggedPiece);
    this.removePieceFromChecker(draggedPiece);
    this.placePieceInTheLandingChecker(draggedPiece, checker);
  }

  private saveFirstPosition(draggedPiece) {
    if (this.isFirstMove()) {
      this.row = draggedPiece.row;
      this.col = draggedPiece.col;
    }
  }

  public restorePlayedPiecePosition(piece) {
    this.checkers[piece.row][piece.col].piece = null;
    piece.row = this.row;
    piece.col = this.col;
    this.checkers[this.row][this.col].piece = piece;
  }

  /**
   * this method is called before the play(move) is saved
   */
  private isFirstMove() {
    return this.plays.length === 0;
  }

  private removePieceFromChecker(piece) {
    this.checkers[piece.row][piece.col].piece = null;
  }

  private placePieceInTheLandingChecker(piece, landingChecker) {
    piece.row = landingChecker.row;
    piece.col = landingChecker.column;
    landingChecker.piece = piece;
  }

  /**
   * 
   * @param piece the piece being played, at this point its position
   * has already been updated
   */
  public shouldCaptureMore(piece) {
    return this.hasCaptured &&
           !this.ordinaryPieceAtLastRow(piece) &&
           !this.canCapture(this.isKing(piece), piece.row, piece.col) &&
           this.couldCaptureMore(piece.row, piece.col);
  }

  private ordinaryPieceAtLastRow(piece) {
    return !this.isKing(piece) && this.isPieceAtLastRow(piece);
  }

  private isPieceAtLastRow(piece) {
    return (piece.owner.id === CREATOR_ID && piece.row === this.checkers.length - 1) ||
           (piece.owner.id === JOINER_ID && piece.row === 0);
  }

  /**
   * checks whether the king has not landed in a position that
   * avoids capturing other opponent's pieces that ought be captured.
   * Since the nearest piece should be captured first, and this is checked while
   * we are sure there was a valid capture but no more capture is possible: we iterate the diagonal 
   * from the checker next to the last captured piece in the direction of the 
   * landingChecker looking for empty positions that could result in more captures
   * 
   * @param checkerRow row index of the last landing checker
   * @param checkerCol column index of the last landing checker
   */
  private couldCaptureMore(checkerRow, checkerCol) {
    let lastCaptured = this.getLastPieceCaptured();
    let rowTraverse = checkerRow - lastCaptured.row < 0 ? -1 : 1;
    let colTraverse = checkerCol - lastCaptured.col < 0 ? -1 : 1;
    let row = lastCaptured.row + rowTraverse;
    let col = lastCaptured.col + colTraverse;
    let piece = null;
    while (this.indicesWithinBounds(row, col) && piece === null) {
      piece = this.checkers[row][col].piece;
      if (this.itemExists(piece)) {
        return false;
      } 
      let canCapture = this.canKingCapture(row, col);
      if (canCapture) {
        return true;
      }
      row = row + rowTraverse;
      col = col + colTraverse;
      piece = null;
    }
    return false;
  }

  private getLastPieceCaptured() {
    return this.captured[this.captured.length - 1];
  }

  /**
   * checker is empty
   * remain in the diagonal
   * @param movedPiece
   * @param landingChecker 
   */
  private isValidOrdinaryPlay(movedPiece, landingChecker) {
    let pieceRowCol = [movedPiece.row, movedPiece.col];
    let checkerRowCol = [landingChecker.row, landingChecker.column];
    return !this.itemExists(landingChecker.piece) &&
           this.isInDiagonal(pieceRowCol, checkerRowCol) &&
           (
             this.isValidOrdinaryMove(pieceRowCol, landingChecker) || 
             this.isValidOrdinaryCapture(pieceRowCol, checkerRowCol)
           ) &&
           this.hasObeyedCapturingRules();
  }

  private hasObeyedCapturingRules() {
    if (this.hasCaptured) {
      return this.hasCapturedDuringMove === true;
    }
    return true;
  }

  private isInDiagonal(rowCol1: number[], rowCol2: number[]) {
    return Math.abs(rowCol2[0] - rowCol1[0]) === Math.abs(rowCol2[1] - rowCol1[1]);
  }

  private isValidOrdinaryMove(prevPosition, landingChecker) {
    return this.isOneUnitForwardMove(prevPosition[0], landingChecker.row) &&
           !this.itemExists(landingChecker.piece);
  }

  private isOneUnitForwardMove(prevRow, finalRow) {
    return prevRow + this.playerId === finalRow;
  }

  private isValidOrdinaryCapture(fromRowCol, toRowCol) {
    this.hasCapturedDuringMove = this.isTwoUnitsApart(fromRowCol[0], toRowCol[0]) && 
           this.hasOpponentPieceInPath(fromRowCol, toRowCol);
    return this.hasCapturedDuringMove;
  }

  private isTwoUnitsApart(row1, row2) {
    return Math.abs(row2 - row1) === 2;
  }

  private hasOpponentPieceInPath(fromRowCol, toRowCol) {
    let row = Math.floor((fromRowCol[0] + toRowCol[0]) / 2);
    let col = Math.floor((fromRowCol[1] + toRowCol[1]) / 2);
    let piece = this.checkers[row][col].piece;
    let result = this.itemExists(piece) && !this.playerOwnsPiece(piece);
    if (result) {
      this.hasCaptured = true;
      this.processCapturedPiece(piece);
    }
    return result;
  }

  private processCapturedPiece(piece) {
    piece.owner.id = -piece.owner.id;
    this.captured.push(piece);
  }

  private shouldCapture() {
    for (let rowCheckers of this.checkers) {
      for (let checker of rowCheckers) {
        let piece = checker.piece;
        if (this.checkerHasPieceBelongingToPlayer(checker) && 
            this.canCapture(this.isKing(piece), piece.row, piece.col)) {
          return true;
        }
      }
    }
    return false;
  }

  private calculateMaxNumberOfPiecesToBeCaptured() {
    let max = 0;
    for (let rowCheckers of this.checkers) {
      for (let checker of rowCheckers) {
        if (this.checkerHasPieceBelongingToPlayer(checker)) {
          let num = this.calculateMaxNumberAPieceCanCapture(checker);
          max = Math.floor(Math.max(max, num));
        }
      }
    }
    this.numberOfPiecesToBeCaptured = max;
  }

  private calculateMaxNumberAPieceCanCapture(checker) {
    const {row, col} = checker.piece;
    let num = 0;
    if (this.isKing(checker.piece)) {
      num = this.getKingMaxPossibleCaptures([checker]);
    } else {
      num = this.getOrdinaryPieceMaxPossibleCaptures(checker.piece);
    }
    checker.piece.row = row;
    checker.piece.col = col;
    this.restoreCapturedPiecesOwnership();
    return num;
  }

  private restoreCapturedPiecesOwnership() {
    for (let piece of this.captured) {
      piece.owner.id = -piece.owner.id;
    }
    this.captured = [];
  }

  private checkerHasPieceBelongingToPlayer(checker) {
    return this.isPlayableChecker(checker.row, checker.column) && 
           this.itemExists(checker.piece) &&
           this.playerOwnsPiece(checker.piece);
  }

  private playerOwnsPiece(piece) {
    return piece.owner.id === this.playerId;
  }

  private isPlayerInTurn() {
    return this.playerId === this.playerInTurn;
  }

  public canCaptureMore(piece) {
    return !this.ordinaryPieceAtLastRow(piece) &&
            this.canCapture(this.isKing(piece), piece.row, piece.col);
  }

  private canCapture(isKing, row, col) {
    if (isKing) {
      return this.canKingCapture(row, col);
    } else {
      return this.canOrdinaryCapture(row, col);
    }
  }

  private canKingCapture(row, col) {
    let nextOccupiedLeftForwardChecker = this.getNextOccupiedChecker(row, col, this.getLeftForwardChecker);
    let nextOccupiedRightForwardChecker = this.getNextOccupiedChecker(row, col, this.getRightForwardChecker);
    let nextOccupiedLeftBackwardChecker = this.getNextOccupiedChecker(row, col, this.getLeftBackwardChecker);
    let nextOccupiedRightBackwardChecker = this.getNextOccupiedChecker(row, col, this.getRightBackwardChecker);
    return this.isLeftForwardCapturable(nextOccupiedLeftForwardChecker) ||
           this.isRightForwardCapturable(nextOccupiedRightForwardChecker) ||
           this.isLeftBackwardCapturable(nextOccupiedLeftBackwardChecker) ||
           this.isRightBackwardCapturable(nextOccupiedRightBackwardChecker);
  }

  /**
   * this method changed the ownership of the pieces ought be captured,
   * when the method completes, the ownership should be restored
   * @param emptyCheckers 
   */
  private getKingMaxPossibleCaptures(emptyCheckers: any[]) {
    let max = 0;
    for (let emptyChecker of emptyCheckers) {
      const { row, column } = emptyChecker;
      let leftForwardChecker = this.getNextOccupiedChecker(row, column, this.getLeftForwardChecker);
      let rightForwardChecker = this.getNextOccupiedChecker(row, column, this.getRightForwardChecker);
      let leftBackwardChecker = this.getNextOccupiedChecker(row, column, this.getLeftBackwardChecker);
      let rightBackwardChecker = this.getNextOccupiedChecker(row, column, this.getRightBackwardChecker);

      let leftForwardCount = 0, rightForwardCount = 0, leftBackwardCount = 0, rightBackwardCount = 0;
      if (this.isLeftForwardCapturable(leftForwardChecker)) {
        leftForwardCount = this.getKingMaxPossibleCapturesAux(leftForwardChecker, this.getLeftForwardChecker);
      }
      if (this.isRightForwardCapturable(rightForwardChecker)) {
        rightForwardCount = this.getKingMaxPossibleCapturesAux(rightForwardChecker, this.getRightForwardChecker);
      }
      if (this.isLeftBackwardCapturable(leftBackwardChecker)) {
        leftBackwardCount = this.getKingMaxPossibleCapturesAux(leftBackwardChecker, this.getLeftBackwardChecker);
      }
      if (this.isRightBackwardCapturable(rightBackwardChecker)) {
        rightBackwardCount = this.getKingMaxPossibleCapturesAux(rightBackwardChecker, this.getRightBackwardChecker);
      }
      let maxOfFour = this.maxOfFour(leftForwardCount, rightForwardCount, leftBackwardCount, rightBackwardCount);
      max = Math.floor(Math.max(max, maxOfFour));
    }
    return max;
  }

  private getKingMaxPossibleCapturesAux(nextChecker, fartherCheckerMethod) {
    let captured = nextChecker.piece;
    // update the captured piece owner to current player to avoid back-capturing
    captured.owner.id = -captured.owner.id;
    this.captured.push(captured);
    let capturedRow = captured.row;
    let capturedCol = captured.col;
    let fartherChecker = fartherCheckerMethod(capturedRow, capturedCol);
    let traverseVector = [
      fartherChecker.row - capturedRow, 
      fartherChecker.column - capturedCol
    ];
    let beyondEmptyCheckers = this.getEmptyCheckersFromCapturedPiece(nextChecker, traverseVector);
    // check further capturing 
    let count = 1 + this.getKingMaxPossibleCaptures(beyondEmptyCheckers);
    // re-update piece position to original
    return count;
  }

  private getEmptyCheckersFromCapturedPiece(checker, traverseVector) {
    let row = checker.row + traverseVector[0];
    let col = checker.column + traverseVector[1];
    let emptyCheckers = [];
    while (this.indicesWithinBounds(row, col)) {
      let nextChecker = this.checkers[row][col];
      if (this.itemExists(nextChecker.piece)) {
        break;
      } 
      emptyCheckers.push(nextChecker);
      row = row + traverseVector[0];
      col = col + traverseVector[1];
    }
    return emptyCheckers;
  }

  private getNextOccupiedChecker(row, col, nextCheckerMethod) {
    let checker;
    while ((checker = nextCheckerMethod(row, col)) != null) {
      if (this.itemExists(checker.piece)) {
        return checker;
      }
      row = checker.row;
      col = checker.column;
    }
    return null;
  }

  private canOrdinaryCapture(row, col) {
    let leftForwardChecker = this.getLeftForwardChecker(row, col);
    let rightForwardChecker = this.getRightForwardChecker(row, col);
    let leftBackwardChecker = this.getLeftBackwardChecker(row, col);
    let rightBackwardChecker = this.getRightBackwardChecker(row, col);
    return this.isLeftForwardCapturable(leftForwardChecker) ||
           this.isRightForwardCapturable(rightForwardChecker) ||
           this.isLeftBackwardCapturable(leftBackwardChecker) ||
           this.isRightBackwardCapturable(rightBackwardChecker);
  }

  /**
   * this method changes the owner of the pieces to be captured, these pieces are
   * saved in an array that restores the owner when the method completes
   * this method changes the position of the capturing piece, this location should be restored
   * when the method completes
   * @param piece 
   */
  private getOrdinaryPieceMaxPossibleCaptures(piece) {
    if (this.isPieceAtLastRow(piece)) {
      return 0;
    }
    const {row, col} = piece;
    let leftForwardCount = 0, rightForwardCount = 0, leftBackwardCount = 0, rightBackwardCount = 0;
    let leftForwardChecker = this.getLeftForwardChecker(row, col);
    let rightForwardChecker = this.getRightForwardChecker(row, col);
    let leftBackwardChecker = this.getLeftBackwardChecker(row, col);
    let rightBackwardChecker = this.getRightBackwardChecker(row, col);
    if (this.isLeftForwardCapturable(leftForwardChecker)) {
      leftForwardCount = this.getOrdinaryPieceMaxPossibleCapturesAux(piece, leftForwardChecker, this.getLeftForwardChecker);
    }
    if (this.isRightForwardCapturable(rightForwardChecker)) {
      rightForwardCount = this.getOrdinaryPieceMaxPossibleCapturesAux(piece, rightForwardChecker, this.getRightForwardChecker);
    }
    if (this.isLeftBackwardCapturable(leftBackwardChecker)) {
      leftBackwardCount = this.getOrdinaryPieceMaxPossibleCapturesAux(piece, leftBackwardChecker, this.getLeftBackwardChecker);
    }
    if (this.isRightBackwardCapturable(rightBackwardChecker)) {
      rightBackwardCount = this.getOrdinaryPieceMaxPossibleCapturesAux(piece, rightBackwardChecker, this.getRightBackwardChecker);
    }
    return this.maxOfFour(leftForwardCount, rightForwardCount, leftBackwardCount, rightBackwardCount);
  }

  private maxOfFour(num1, num2, num3, num4) {
    let max1 = Math.max(num1, num2);
    let max2 = Math.max(num3, num4);
    return Math.floor(Math.max(max1, max2));
  }

  private getOrdinaryPieceMaxPossibleCapturesAux(piece, nextChecker, fartherCheckerMethod) {
    const { row, col} = piece;
    let captured = nextChecker.piece;
    this.captured.push(captured);
    let capturedRow = captured.row;
    let capturedCol = captured.col;
    let fartherChecker = fartherCheckerMethod(capturedRow, capturedCol);
    // update piece position
    piece.row = fartherChecker.row;
    piece.col = fartherChecker.column;
    // update the captured piece owner to current player to avoid back-capturing
    captured.owner.id = -captured.owner.id;
    // check further capturing 
    let count = 1 + this.getOrdinaryPieceMaxPossibleCaptures(piece);
    // re-update piece position to original
    piece.row = row;
    piece.col = col;
    return count;
  }

  private isLeftForwardCapturable(leftForwardChecker) {
    if (this.itemExists(leftForwardChecker) && this.isOpponentPiece(leftForwardChecker)) {
      let row = leftForwardChecker.row;
      let col = leftForwardChecker.column;
      let fartherLeftForwardChecker = this.getLeftForwardChecker(row, col);
      return this.isEmptyChecker(fartherLeftForwardChecker);
    }
    return false;
  }

  private isRightForwardCapturable(rightForwardChecker) {
    if (this.itemExists(rightForwardChecker) && this.isOpponentPiece(rightForwardChecker)) {
      let row = rightForwardChecker.row;
      let col = rightForwardChecker.column;
      let fartherRightForwardChecker = this.getRightForwardChecker(row, col);
      return this.isEmptyChecker(fartherRightForwardChecker);
    }
    return false;
  }

  private isLeftBackwardCapturable(leftBackwardChecker) {
    if (this.itemExists(leftBackwardChecker) && this.isOpponentPiece(leftBackwardChecker)) {
      let row = leftBackwardChecker.row;
      let col = leftBackwardChecker.column;
      let fartherLeftBackwardChecker = this.getLeftBackwardChecker(row, col);
      return this.isEmptyChecker(fartherLeftBackwardChecker);
    }
    return false;
  }

  private isRightBackwardCapturable(rightBackwardChecker) {
    if (this.itemExists(rightBackwardChecker) && this.isOpponentPiece(rightBackwardChecker)) {
      let row = rightBackwardChecker.row;
      let col = rightBackwardChecker.column;
      let fartherRightBackwardChecker = this.getRightBackwardChecker(row, col);
      return this.isEmptyChecker(fartherRightBackwardChecker);
    }
    return false;
  }

  private isOpponentPiece(checker) {
    // the checker exists and is owned by the opponent
    return this.itemExists(checker) && this.itemExists(checker.piece) && !this.playerOwnsPiece(checker.piece);
  }

  private hasEmptyForwardChecker(piece) {
    let leftChecker = this.getLeftForwardChecker(piece.row, piece.col);
    let rightChecker = this.getRightForwardChecker(piece.row, piece.col);
    return this.isEmptyChecker(leftChecker) || this.isEmptyChecker(rightChecker);
  }

  private hasEmptyBackwardChecker(piece) {
    let leftChecker = this.getLeftBackwardChecker(piece.row, piece.col);
    let rightChecker = this.getRightBackwardChecker(piece.row, piece.col);
    return this.isEmptyChecker(leftChecker) || this.isEmptyChecker(rightChecker);
  }

  private isKingAndHasEmptyBackwardChecker(piece) {
    if (!this.isKing(piece)) {
      return false;
    }
    return this.hasEmptyBackwardChecker(piece);
  }

  private isKing(piece) {
    return piece.type === TYPE_KING;
  }

  private isEmptyChecker(checker) {
    // the checker exists but it has no piece
    return this.itemExists(checker) && !this.itemExists(checker.piece);
  }

  public itemExists(item) {
    return item !== undefined && item !== null;
  }

  // given the choice of playerIds, the row will increase for the creator
  // but decrease for the joiner
  private getLeftForwardChecker = (row: number, col: number) => {
    let nextRow = row + this.playerId;
    let nextCol = col - 1;
    return this.nextChecker(nextRow, nextCol);
  }

  // given the choice of playerIds, the row will increase for the creator
  // but decrease for the joiner
  private getRightForwardChecker = (row: number, col: number) => {
    let nextRow = row + this.playerId;
    let nextCol = col + 1;
    return this.nextChecker(nextRow, nextCol);
  }

  // given the choice of playerIds, the row will decrease for the creator
  // but decrease for the joiner
  private getLeftBackwardChecker = (row: number, col: number) => {
    let nextRow = row - this.playerId;
    let nextCol = col - 1;
    return this.nextChecker(nextRow, nextCol);
  }

  // given the choice of playerIds, the row will decrease for the creator
  // but decrease for the joiner
  private getRightBackwardChecker = (row: number, col: number) => {
    let nextRow = row - this.playerId;
    let nextCol = col + 1;
    return this.nextChecker(nextRow, nextCol);
  }

  private nextChecker(row, col) {
    if (this.indicesWithinBounds(row, col)) {
      return this.checkers[row][col];
    }
    return null;
  }

  private indicesWithinBounds(row, col) {
    return this.indexWithinBounds(row) && this.indexWithinBounds(col);
  }

  private indexWithinBounds(index) {
    return index >= 0 && index <= this.boardSize - 1;
  }

}
