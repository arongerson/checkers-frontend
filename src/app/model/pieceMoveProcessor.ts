import { 
    ROW_ATTRIBUTE, COL_ATTRIBUTE,
    OFFSET_X_ATTR, OFFSET_Y_ATTR
} from '../util/constants';
import { BoardService } from '../services/board.service';

export class PieceMoveProcessor {

    public static processPieceMove(draggedPiece, board, canvas, target) {
        let checker = board.getLandingChecker(draggedPiece.element, canvas.size);
        if (checker !== null && board.notSameChecker(checker, target)) {
          this.validatePieceMove(draggedPiece, board, canvas, checker, target);
        } else {
          let prevChecker = board.getChecker(draggedPiece.row, draggedPiece.col);
          this.snapPiece(draggedPiece, prevChecker, canvas, target);
        }
    }

    private static validatePieceMove(draggedPiece, board, canvas, checker, target) {
        if (board.isValidMove(draggedPiece, checker)) {
          this.checkMoveType(draggedPiece, board, canvas, checker, target);
        } else {
          let prevChecker = board.getChecker(draggedPiece.row, draggedPiece.col);
          this.snapPiece(draggedPiece, prevChecker, canvas, target);
        }
    }
    
    private static checkMoveType(draggedPiece, board: BoardService, canvas, checker, target) {
        if (board.didCapture()) {
          this.processPieceCaptured(draggedPiece, board, canvas, checker, target);
        } else {
          this.processNormalMove(draggedPiece, board, canvas, checker, target);
        }
    }

    private static processNormalMove(draggedPiece, board: BoardService, canvas, checker, target) {
      let prevPieceRow = draggedPiece.row;
      let prevPieceCol = draggedPiece.col;
      board.updatePlayingPieceAfterMove(draggedPiece, checker);
      board.saveMovePlay([prevPieceRow, prevPieceCol], [checker.row, checker.column]);
      if (!board.hasCapturedAll()) {
        this.restorePieceToOriginalLocation(draggedPiece, board, canvas, target);
        board.initTurn();
      } else {
        this.snapPiece(draggedPiece, checker, canvas, target);
        board.finalizePieceMove(draggedPiece);
      }
    }

    private static processPieceCaptured(draggedPiece, board: BoardService, canvas, checker, target) {
      let prevPieceRow = draggedPiece.row;
      let prevPieceCol = draggedPiece.col;
      board.updatePlayingPieceAfterMove(draggedPiece, checker);
      board.saveCapturePlay([prevPieceRow, prevPieceCol], [checker.row, checker.column]);
      if (board.canCaptureMore(draggedPiece)) {
        board.setDraggedPiece(draggedPiece);
        this.snapPiece(draggedPiece, checker, canvas, target);
      } else if (!board.hasCapturedAll()) {
        // show message that all have to be captured
        console.log('not all captured');
        this.restorePieceToOriginalLocation(draggedPiece, board, canvas, target);
        board.initTurn();
      } else {
        console.log('that was the final capture');
        this.snapPiece(draggedPiece, checker, canvas, target);
        board.finalizePieceMove(draggedPiece);
      }
  }

  private static restorePieceToOriginalLocation(draggedPiece, board, canvas, target) {
    board.restorePlayedPiecePosition(draggedPiece);
    let originalChecker = board.getChecker(draggedPiece.row, draggedPiece.col);
    this.snapPiece(draggedPiece, originalChecker, canvas, target);
  }

  /**
   * Using the checker to find the startX and startY since the checker does not move
   * @param piece the piece being played
   * @param checker the checker to snap to
   */
  private static snapPiece(piece, checker, canvas, target) {
    const { startX, startY, size} = canvas;
    piece.element.style.left = `${startX + checker.column * size}px`;
    piece.element.style.top = `${startY + checker.row * size}px`;
    piece.element.style.transform = 'none';
    target.setAttribute(ROW_ATTRIBUTE, checker.row.toString());
    target.setAttribute(COL_ATTRIBUTE, checker.column.toString());
    target.setAttribute(OFFSET_X_ATTR, '0');
    target.setAttribute(OFFSET_Y_ATTR, '0');
  }
    
  private static removeCapturedPieceFromCanvas(board, canvas) {
      let lastCaptured = board.getLastPieceCaptured();
      canvas.removeChild(lastCaptured.element);
  }
}