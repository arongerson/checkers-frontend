import { Injectable } from '@angular/core';
import { PieceMoveService } from '../model/pieceMoveProcessor';
import { BoardService } from './board.service';
import { WebSocketsService } from './web-sockets.service';

import {
  OFFSET_X_ATTR, 
  OFFSET_Y_ATTR,
  ROW_ATTRIBUTE,
  COL_ATTRIBUTE
} from '../util/constants';

@Injectable({
  providedIn: 'root'
})
export class DragEventService {

  initialX = 0;
  initialY = 0;
  currentX = 0;
  currentY = 0;
  offsetX = 0;
  offsetY = 0;
  draggedElement: any;
  draggedPiece: any;
  canvas: any;

  constructor(
    private board: BoardService,
    private socket: WebSocketsService
  ) { }

  init(canvas: any) {
    this.canvas = canvas;
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
}
