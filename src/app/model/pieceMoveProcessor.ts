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
    
    private static checkMoveType(draggedPiece, board, canvas, checker, target) {
        if (board.didCapture()) {
          this.processPieceCaptured(draggedPiece, board, canvas, checker, target);
        } else {
          console.log('moving');
          board.saveMovePlay([draggedPiece.row, draggedPiece.col], [checker.row, checker.column]);
          board.updateMove(draggedPiece, checker);
          this.snapPiece(draggedPiece, checker, canvas, target);
          board.finalizePieceMove();
        }
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
    
    private static processPieceCaptured(
        draggedPiece, board: BoardService, canvas, checker, target) {
        let prevPieceRow = draggedPiece.row;
        let prevPieceCol = draggedPiece.col;
        board.updateCapturing(draggedPiece, checker);
        if (board.shouldCaptureMore(draggedPiece)) {
          console.log('invalid capture');
          board.cancelLastCaptureUpdate(draggedPiece, prevPieceRow, prevPieceCol);
          let prevChecker = board.getChecker(draggedPiece.row, draggedPiece.col);
          this.snapPiece(draggedPiece, prevChecker, canvas, target);
        } else {
          board.saveCapturePlay([prevPieceRow, prevPieceCol], [checker.row, checker.column]);
          if (board.canCaptureMore(draggedPiece)) {
            // player should continue capturing
            board.setDraggedPiece(draggedPiece);
            this.snapPiece(draggedPiece, checker, canvas, target);
          } else {
            console.log('that was the final capture');
            this.snapPiece(draggedPiece, checker, canvas, target);
            board.finalizePieceMove();
          }
        }
    }
    
    private static removeCapturedPieceFromCanvas(board, canvas) {
        let lastCaptured = board.getLastPieceCaptured();
        canvas.removeChild(lastCaptured.element);
    }
}