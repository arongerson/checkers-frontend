import { Injectable } from '@angular/core';

import { StorageService } from './storage.service';
import { CREATOR_ID, JOINER_ID } from '../util/constants';

interface Position {
  row: number;
  col: number;
}

interface Play {
  from: Position;
  to: Position;
  captured: Position;
}

import {
  OFFSET_X_ATTR, 
  OFFSET_Y_ATTR,
  ROW_ATTRIBUTE,
  COL_ATTRIBUTE,
  PIECE_EDGE_OFFSET,
  TYPE_KING,
  TYPE_NORMAL
} from '../util/constants';
import { $$ } from 'protractor';

@Injectable({
  providedIn: 'root'
})
export class BoardService {

  private checkers: any;
  private playerInTurn: number; // the id of the player who is in turn
  private playerId: number;
  private hasCaptured = false;
  // this is set after the first successful move during the turn
  // it is checked for further moves to prevent un-played pieces from being dragged
  private draggedPiece;
  private captured = [];
  private plays: Play[] = [];
  startX: number;
  startY: number;

  constructor(private storage: StorageService) {
  }

  setPlayData(playData) {
    this.checkers = playData.checkers;
    this.playerInTurn = playData.turn;
    this.playerId = this.storage.getPlayerId();
  }

  setDraggedPiece(piece) {
    this.draggedPiece = piece;
  }

  updatePlayerInTurn(playerInTurn: number) {
    this.playerInTurn = playerInTurn;
  }

  getCheckers() {
    return this.checkers;
  }

  getChecker(row, col) {
    return this.checkers[row][col];
  }

  saveCapturePlay(from, to) {
    let lastCaptured = this.getLastPieceCaptured();
    this.plays.push({
      from: {row: from[0], col: from[1]},
      to: {row: to[0], col: to[1]},
      captured: {row: lastCaptured.row, col: lastCaptured.col}
    });
  }

  saveMovePlay(from, to) {
    this.plays.push({
      from: {row: from[0], col: from[1]},
      to: {row: to[0], col: to[1]},
      captured: null
    });
  }

  getDraggedPiece(draggedElement) {
    let row = draggedElement.getAttribute(ROW_ATTRIBUTE);
    let col = draggedElement.getAttribute(COL_ATTRIBUTE);
    let piece = this.getPiece(row, col);
    return piece;
  }

  getPiece(row: number, col: number) {
    return this.checkers[row][col].piece;
  }

  notSameChecker(checker, target) {
    let targetRow = parseInt(target.getAttribute(ROW_ATTRIBUTE));
    let targetCol = parseInt(target.getAttribute(COL_ATTRIBUTE));
    return checker.row !== targetRow || checker.column !== targetCol;
  }

  getLandingChecker(element, size) {
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

  isPlayableChecker(row, col) {
    return (row + col) % 2 === 1;
  }

  didCapture() {
    return this.hasCaptured;
  }

  isLandingChecker(draggedElementCoords, checkerCoords, size) {
    let xDiff = Math.abs(draggedElementCoords[0] - checkerCoords[0]);
    let yDiff = Math.abs(draggedElementCoords[1] - checkerCoords[1]);
    if (xDiff < size && yDiff < size) {
      let overlappingArea = (size - xDiff) * (size - yDiff);
      // if the area is atleast 70% of the checker the move is acceptable
      return overlappingArea >= 0.7 * size * size;
    }
    return false;
  }

  getLeftTopSize(element) {
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
  isPieceMovable(pieceElement) {
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
  finalizePieceMove() {
    this.playerInTurn = -this.playerInTurn;
  }

  /**
   * 
   * @param piece the piece being dragged
   */
  isDifferentPiece(piece) {
    return this.itemExists(this.draggedPiece) && this.draggedPiece !== piece;
  }

  isValidMove(movedPiece, landingChecker) {
    if (this.isKing(movedPiece)) {
      return this.isValidKingPlay(movedPiece, landingChecker);
    }
    return this.isValidOrdinaryPlay(movedPiece, landingChecker);
  }

  isValidKingPlay(movedPiece, landingChecker) {
    let pieceRowCol = [movedPiece.row, movedPiece.col];
    let checkerRowCol = [landingChecker.row, landingChecker.column];
    let piecesBetween = this.getPiecesBetweenPath(pieceRowCol, checkerRowCol);
    return !this.itemExists(landingChecker.piece) &&
           this.isInDiagonal(pieceRowCol, checkerRowCol) &&
           (
             this.isValidKingMove(piecesBetween) ||
             this.isValidKingCapture(piecesBetween)
           ) &&
           this.hasObeyedCapturingRules();
  }

  isValidKingMove(piecesBetween) {
    return piecesBetween.length === 0;
  }

  isValidKingCapture(piecesBetween) {
    this.hasCaptured = piecesBetween.length === 1 && !this.playerOwnsPiece(piecesBetween[0]);
    if (this.hasCaptured) {
      this.captured.push(piecesBetween[0]);
    }
    return this.hasCaptured;
  }

  getPiecesBetweenPath(pos1, pos2) {
    let rowTraverse = pos2[0] - pos1[0] < 0 ? -1 : 1;
    let colTraverse = pos2[1] - pos1[1] < 0 ? -1 : 1;
    let row = pos1[0] + rowTraverse;
    let col = pos1[1] + colTraverse;
    let numOfCheckersBetween = pos2[0] - pos1[0];
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

  /**
   * this is not the final update since there might still be more moves to be made
   * @param piece the piece being played
   * @param landingChecker 
   */
  updateCapturing(piece, landingChecker) {
    this.removePieceFromChecker(piece);
    // this.removeCapturedPieceFromBoard();
    this. changeCapturedPieceOwner();
    this.placePieceInTheLandingChecker(piece, landingChecker);
  }

  cancelLastCaptureUpdate(piece, prevRow, prevCol) {
    this.removePieceFromChecker(piece);
    this.placeInPreviousChecker(piece, prevRow, prevCol);
    // this.returnLastCapturedPiece();
    this. changeCapturedPieceOwner();
    this.removeLastCapturedPieceFromList();
  }

  updateMove(draggedPiece, checker) {
    this.removePieceFromChecker(draggedPiece);
    this.placePieceInTheLandingChecker(draggedPiece, checker);
  }

  removeLastCapturedPieceFromList() {
    this.captured.pop();
  }

  removePieceFromChecker(piece) {
    this.checkers[piece.row][piece.col].piece = null;
  }

  placeInPreviousChecker(piece, prevRow, prevCol) {
    let checker = this.checkers[prevRow][prevCol];
    checker.piece = piece;
    piece.row = prevRow;
    piece.col = prevCol;
  }

  returnLastCapturedPiece() {
    let lastCaptured = this.getLastPieceCaptured();
    let checker = this.checkers[lastCaptured.row][lastCaptured.col];
    checker.piece = lastCaptured;
  }

  /**
   * at this point the pieceElement has already been removed from the canvas
   */
  removeCapturedPieceFromBoard() {
    let lastCaptured = this.getLastPieceCaptured();
    this.removePieceFromChecker(lastCaptured);
  }

  changeCapturedPieceOwner() {
    let lastCaptured = this.getLastPieceCaptured();
    lastCaptured.owner.id = -lastCaptured.owned.id;
  }

  placePieceInTheLandingChecker(piece, landingChecker) {
    piece.row = landingChecker.row;
    piece.col = landingChecker.column;
    landingChecker.piece = piece;
  }

  /**
   * 
   * @param piece the piece being played, at this point its position
   * has already been updated
   */
  shouldCaptureMore(piece) {
    return this.hasCaptured &&
           !this.ordinaryPieceAtLastRow(piece) &&
           !this.canCapture(this.isKing(piece), piece.row, piece.col) &&
           this.couldCaptureMore(piece.row, piece.col);
  }

  ordinaryPieceAtLastRow(piece) {
    return !this.isKing(piece) && this.isPieceAtLastRow(piece);
  }

  isPieceAtLastRow(piece) {
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
  couldCaptureMore(checkerRow, checkerCol) {
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

  getLastPieceCaptured() {
    return this.captured[this.captured.length - 1];
  }

  /**
   * checker is empty
   * remain in the diagonal
   * @param movedPiece
   * @param landingChecker 
   */
  isValidOrdinaryPlay(movedPiece, landingChecker) {
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

  hasObeyedCapturingRules() {
    if (this.shouldCapture()) {
      return this.hasCaptured;
    }
    return true;
  }

  isInDiagonal(rowCol1: number[], rowCol2: number[]) {
    return Math.abs(rowCol2[0] - rowCol1[0]) === Math.abs(rowCol2[1] - rowCol1[1]);
  }

  isValidOrdinaryMove(prevPosition, landingChecker) {
    return this.isOneUnitForwardMove(prevPosition[0], landingChecker.row) &&
           !this.itemExists(landingChecker.piece);
  }

  isOneUnitForwardMove(prevRow, finalRow) {
    return prevRow + this.playerId === finalRow;
  }

  isValidOrdinaryCapture(fromRowCol, toRowCol) {
    this.hasCaptured = this.isTwoUnitsApart(fromRowCol[0], toRowCol[0]) && 
           this.hasOpponentPieceInPath(fromRowCol, toRowCol);
    return this.hasCaptured;
  }

  isTwoUnitsApart(row1, row2) {
    return Math.abs(row2 - row1) === 2;
  }

  hasOpponentPieceInPath(fromRowCol, toRowCol) {
    let row = Math.floor((fromRowCol[0] + toRowCol[0]) / 2);
    let col = Math.floor((fromRowCol[1] + toRowCol[1]) / 2);
    let piece = this.checkers[row][col].piece;
    let result = this.itemExists(piece) && !this.playerOwnsPiece(piece);
    if (result) {
      this.captured.push(piece);
    }
    return result;
  }

  shouldCapture() {
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

  checkerHasPieceBelongingToPlayer(checker) {
    return this.isPlayableChecker(checker.row, checker.column) && 
           this.itemExists(checker.piece) &&
           this.playerOwnsPiece(checker.piece);
  }

  playerOwnsPiece(piece) {
    return piece.owner.id === this.playerId;
  }

  isPlayerInTurn() {
    return this.playerId === this.playerInTurn;
  }

  canCaptureMore(piece) {
    return !this.ordinaryPieceAtLastRow(piece) &&
            this.canCapture(this.isKing(piece), piece.row, piece.col);
  }

  canCapture(isKing, row, col) {
    if (isKing) {
      return this.canKingCapture(row, col);
    } else {
      return this.canOrdinaryCapture(row, col);
    }
  }

  canKingCapture(row, col) {
    let nextOccupiedLeftForwardChecker = this.nextOccupiedLeftForwardChecker(row, col);
    let nextOccupiedRightForwardChecker = this.nextOccupiedRightForwardChecker(row, col);
    let nextOccupiedLeftBackwardChecker = this.nextOccupiedLeftBackwardChecker(row, col);
    let nextOccupiedRightBackwardChecker = this.nextOccupiedRightBackwardChecker(row, col);
    return this.isLeftForwardCapturable(nextOccupiedLeftForwardChecker) ||
           this.isRightForwardCapturable(nextOccupiedRightForwardChecker) ||
           this.isLeftBackwardCapturable(nextOccupiedLeftBackwardChecker) ||
           this.isRightBackwardCapturable(nextOccupiedRightBackwardChecker);
  }

  getKingMaxPossibleCaptures(emptyCheckers) {
    let max = 0;
    for (let emptyChecker of emptyCheckers) {
      const { row, column } = emptyCheckers;
      let leftForwardChecker = this.nextOccupiedLeftForwardChecker(row, column);
      let rightForwardChecker = this.nextOccupiedRightForwardChecker(row, column);
      let leftBackwardChecker = this.nextOccupiedLeftBackwardChecker(row, column);
      let rightBackwardChecker = this.nextOccupiedRightBackwardChecker(row, column);

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

  getKingMaxPossibleCapturesAux(nextChecker, fartherCheckerMethod) {
    let captured = nextChecker.piece;
    // update the captured piece owner to current player to avoid back-capturing
    captured.owner.id = -captured.owner.id;
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

  getEmptyCheckersFromCapturedPiece(checker, traverseVector) {
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

  nextOccupiedLeftForwardChecker(row, col) {
    let checker = null;
    do {
      row = row + this.playerId;
      col = col - 1;
      checker = this.nextChecker(row, col);
    } while(this.isEmptyChecker(checker));
    return checker;
  }

  nextOccupiedRightForwardChecker(row, col) {
    let checker = null;
    do {
      row = row + this.playerId;
      col = col + 1;
      checker = this.nextChecker(row, col);
    } while(this.isEmptyChecker(checker));
    return checker;
  }

  nextOccupiedLeftBackwardChecker(row, col) {
    let checker = null;
    do {
      row = row - this.playerId;
      col = col - 1;
      checker = this.nextChecker(row, col);
    } while(this.isEmptyChecker(checker));
    return checker;
  }

  nextOccupiedRightBackwardChecker(row, col) {
    let checker = null;
    do {
      row = row - this.playerId;
      col = col + 1;
      checker = this.nextChecker(row, col);
    } while(this.isEmptyChecker(checker));
    return checker;
  }

  canOrdinaryCapture(row, col) {
    let leftForwardChecker = this.getLeftForwardChecker(row, col);
    let rightForwardChecker = this.getRightForwardChecker(row, col);
    let leftBackwardChecker = this.getLeftBackwardChecker(row, col);
    let rightBackwardChecker = this.getRightBackwardChecker(row, col);
    return this.isLeftForwardCapturable(leftForwardChecker) ||
           this.isRightForwardCapturable(rightForwardChecker) ||
           this.isLeftBackwardCapturable(leftBackwardChecker) ||
           this.isRightBackwardCapturable(rightBackwardChecker);
  }

  getOrdinaryPieceMaxPossibleCaptures(piece) {
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

  maxOfFour(num1, num2, num3, num4) {
    let max1 = Math.max(num1, num2);
    let max2 = Math.max(num3, num4);
    return Math.floor(Math.max(max1, max2));
  }

  getOrdinaryPieceMaxPossibleCapturesAux(piece, nextChecker, fartherCheckerMethod) {
    const { row, col} = piece;
    let captured = nextChecker.piece;
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

  isLeftForwardCapturable(leftForwardChecker) {
    if (this.isOpponentPiece(leftForwardChecker)) {
      let row = leftForwardChecker.row;
      let col = leftForwardChecker.column;
      let fartherLeftForwardChecker = this.getLeftForwardChecker(row, col);
      return this.isEmptyChecker(fartherLeftForwardChecker);
    }
    return false;
  }

  isRightForwardCapturable(rightForwardChecker) {
    if (this.isOpponentPiece(rightForwardChecker)) {
      let row = rightForwardChecker.row;
      let col = rightForwardChecker.column;
      let fartherRightForwardChecker = this.getRightForwardChecker(row, col);
      return this.isEmptyChecker(fartherRightForwardChecker);
    }
    return false;
  }

  isLeftBackwardCapturable(rightBackwardChecker) {
    if (this.isOpponentPiece(rightBackwardChecker)) {
      let row = rightBackwardChecker.row;
      let col = rightBackwardChecker.column;
      let fartherLeftBackwardChecker = this.getRightBackwardChecker(row, col);
      return this.isEmptyChecker(fartherLeftBackwardChecker);
    }
    return false;
  }

  isRightBackwardCapturable(rightBackwardChecker) {
    if (this.isOpponentPiece(rightBackwardChecker)) {
      let row = rightBackwardChecker.row;
      let col = rightBackwardChecker.column;
      let fartherRightBackwardChecker = this.getRightBackwardChecker(row, col);
      return this.isEmptyChecker(fartherRightBackwardChecker);
    }
    return false;
  }

  isOpponentPiece(checker) {
    // the checker exists and is owned by the opponent
    return this.itemExists(checker) && this.itemExists(checker.piece) && !this.playerOwnsPiece(checker.piece);
  }

  hasEmptyForwardChecker(piece) {
    let leftChecker = this.getLeftForwardChecker(piece.row, piece.col);
    let rightChecker = this.getRightForwardChecker(piece.row, piece.col);
    return this.isEmptyChecker(leftChecker) || this.isEmptyChecker(rightChecker);
  }

  hasEmptyBackwardChecker(piece) {
    let leftChecker = this.getLeftBackwardChecker(piece.row, piece.col);
    let rightChecker = this.getRightBackwardChecker(piece.row, piece.col);
    return this.isEmptyChecker(leftChecker) || this.isEmptyChecker(rightChecker);
  }

  isKingAndHasEmptyBackwardChecker(piece) {
    if (!this.isKing(piece)) {
      return false;
    }
    return this.hasEmptyBackwardChecker(piece);
  }

  isKing(piece) {
    return piece.type === TYPE_KING;
  }

  isEmptyChecker(checker) {
    // the checker exists but it has no piece
    return this.itemExists(checker) && !this.itemExists(checker.piece);
  }

  itemExists(item) {
    return item !== undefined && item !== null;
  }

  // given the choice of playerIds, the row will increase for the creator
  // but decrease for the joiner
  getLeftForwardChecker(row: number, col: number) {
    let nextRow = row + this.playerId;
    let nextCol = col - 1;
    return this.nextChecker(nextRow, nextCol);
  }

  // given the choice of playerIds, the row will increase for the creator
  // but decrease for the joiner
  getRightForwardChecker(row: number, col: number) {
    let nextRow = row + this.playerId;
    let nextCol = col + 1;
    return this.nextChecker(nextRow, nextCol);
  }

  // given the choice of playerIds, the row will decrease for the creator
  // but decrease for the joiner
  getLeftBackwardChecker(row: number, col: number) {
    let nextRow = row - this.playerId;
    let nextCol = col--;
    return this.nextChecker(nextRow, nextCol);
  }

  // given the choice of playerIds, the row will decrease for the creator
  // but decrease for the joiner
  getRightBackwardChecker(row: number, col: number) {
    let nextRow = row - this.playerId;
    let nextCol = col++;
    return this.nextChecker(nextRow, nextCol);
  }

  nextChecker(row, col) {
    if (this.indicesWithinBounds(row, col)) {
      return this.checkers[row][col];
    }
    return null;
  }

  indicesWithinBounds(row, col) {
    return this.indexWithinBounds(row) && this.indexWithinBounds(col);
  }

  indexWithinBounds(index) {
    return index >= 0 && index <= 7;
  }

}
