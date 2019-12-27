import { 
    ROW_ATTRIBUTE, COL_ATTRIBUTE,
    OFFSET_X_ATTR, OFFSET_Y_ATTR
} from '../util/constants';
import { BoardService } from '../services/board.service';

export class PieceMoveProcessor {

    public static processPieceMove(draggedPiece, board, canvas, target) {
        let checker = board.getLandingChecker(draggedPiece.element, canvas.size);
        if (checker !== null && board.notSameChecker(checker, target)) {
          this.validatePieceMove(draggedPiece, board, canvas, checker);
        } else {
          let prevChecker = board.getChecker(draggedPiece.row, draggedPiece.col);
          this.snapPiece(draggedPiece, prevChecker, canvas);
        }
    }

    private static validatePieceMove(draggedPiece, board, canvas, checker) {
        if (board.isValidMove(draggedPiece, checker)) {
          this.checkMoveType(draggedPiece, board, canvas, checker);
        } else {
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
        console.log('normal capture more');
        this.restorePieceToOriginalLocation(draggedPiece, board, canvas);
        board.initTurn();
      } else {
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
        console.log('capture more');
      } else if (!board.hasCapturedAll()) {
        // show message that all have to be captured
        console.log('not all captured');
        this.restorePieceToOriginalLocation(draggedPiece, board, canvas);
        board.initTurn();
      } else {
        console.log('that was the final capture');
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
    const { startX, startY, size} = canvas;
    piece.element.style.left = `${startX + checker.column * size}px`;
    piece.element.style.top = `${startY + checker.row * size}px`;
    piece.element.style.transform = 'none';
    let circle = piece.element.firstChild.firstChild;
    circle.setAttribute(ROW_ATTRIBUTE, checker.row.toString());
    circle.setAttribute(COL_ATTRIBUTE, checker.column.toString());
    circle.setAttribute(OFFSET_X_ATTR, '0');
    circle.setAttribute(OFFSET_Y_ATTR, '0'); 
  }
    
  private static removeCapturedPieceFromCanvas(board, canvas) {
      let lastCaptured = board.getLastPieceCaptured();
      canvas.removeChild(lastCaptured.element);
  }
}