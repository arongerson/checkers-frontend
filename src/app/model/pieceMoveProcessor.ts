import { Injectable } from '@angular/core';
import { 
    ROW_ATTRIBUTE, COL_ATTRIBUTE,
    OFFSET_X_ATTR, OFFSET_Y_ATTR
} from '../util/constants';
import { BoardService } from '../services/board.service';
import { UtilService } from '../services/util.service';

@Injectable({
  providedIn: 'root'
})
export class PieceMoveService {

    private static feedback = "";

    public static processPieceMove(draggedPiece, board, canvas, target) {
        let checker = board.getLandingChecker(draggedPiece.element, canvas.size);
        if (checker !== null && board.notSameChecker(checker, target)) {
          this.validatePieceMove(draggedPiece, board, canvas, checker);
        } else {
          this.feedback = `wrong move`;
          let prevChecker = board.getChecker(draggedPiece.row, draggedPiece.col);
          this.snapPiece(draggedPiece, prevChecker, canvas);
        }
    }

    private static validatePieceMove(draggedPiece, board, canvas, checker) {
        if (board.isValidMove(draggedPiece, checker)) {
          this.checkMoveType(draggedPiece, board, canvas, checker);
        } else {
          this.feedback = `wrong move`;
          let prevChecker = board.getChecker(draggedPiece.row, draggedPiece.col);
          this.snapPiece(draggedPiece, prevChecker, canvas);
        }
    }
    
    private static checkMoveType(draggedPiece, board: BoardService, canvas, checker) {
        if (board.didCapture()) {
          this.processPieceCaptured(draggedPiece, board, canvas, checker);
        } else {
          this.processNormalMove(draggedPiece, board, canvas, checker);
        }
    }

    private static processNormalMove(draggedPiece, board: BoardService, canvas, checker) {
      let prevPieceRow = draggedPiece.row;
      let prevPieceCol = draggedPiece.col;
      board.updatePlayingPieceAfterMove(draggedPiece, checker);
      board.saveMovePlay([prevPieceRow, prevPieceCol], [checker.row, checker.column]);
      if (!board.hasCapturedAll()) {
        this.feedback = `should capture`;
        this.restorePieceToOriginalLocation(draggedPiece, board, canvas);
        board.initTurn();
      } else {
        this.feedback = "turn completed";
        this.snapPiece(draggedPiece, checker, canvas);
        board.finalizePieceMove(draggedPiece);
      }
    }

    private static processPieceCaptured(draggedPiece, board: BoardService, canvas, checker) {
      let prevPieceRow = draggedPiece.row;
      let prevPieceCol = draggedPiece.col;
      board.updatePlayingPieceAfterMove(draggedPiece, checker);
      board.saveCapturePlay([prevPieceRow, prevPieceCol], [checker.row, checker.column]);
      if (board.canCaptureMore(draggedPiece)) {
        board.setDraggedPiece(draggedPiece);
        this.snapPiece(draggedPiece, checker, canvas);
        this.feedback = `capture more...`;
      } else if (!board.hasCapturedAll()) {
        // show message that all have to be captured
        this.feedback = `Choose a path that captures ${board.getNumberToBeCaptured()} pieces`;
        this.restorePieceToOriginalLocation(draggedPiece, board, canvas);
        board.initTurn();
      } else {
        this.feedback = "turn complted";
        this.snapPiece(draggedPiece, checker, canvas);
        board.finalizePieceMove(draggedPiece);
      }
  }

  private static restorePieceToOriginalLocation(draggedPiece, board, canvas) {
    board.restorePlayedPiecePosition(draggedPiece);
    let originalChecker = board.getChecker(draggedPiece.row, draggedPiece.col);
    this.snapPiece(draggedPiece, originalChecker, canvas);
  }

  /**
   * Using the checker to find the startX and startY since the checker does not move
   * @param piece the piece being played
   * @param checker the checker to snap to
   */
  private static snapPiece(piece, checker, canvas) {
    UtilService.positionElementOnTheBoard(piece, canvas);
    let circle = piece.element.firstChild.firstChild;
    UtilService.setCircleAttributes(circle, checker.row, checker.column, 0, 0);
  }
    
  private static removeCapturedPieceFromCanvas(board, canvas) {
      let lastCaptured = board.getLastPieceCaptured();
      canvas.removeChild(lastCaptured.element);
  }

  public static getFeedback() {
    return this.feedback;
  }

  public static clearFeedback() {
    this.feedback = "";
  }

  public static setFeedback(feedback: string) {
    this.feedback = feedback;
  }
}