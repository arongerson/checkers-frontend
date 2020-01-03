import { Injectable } from '@angular/core';

import {
  OFFSET_X_ATTR, 
  OFFSET_Y_ATTR,
  ROW_ATTRIBUTE,
  COL_ATTRIBUTE
} from '../util/constants';
import { CommentStmt } from '@angular/compiler';

@Injectable({
  providedIn: 'root'
})
export class CanvasService {

  initialX: number = 0;
  initialY: number = 0;
  currentX: number = 0;
  currentY: number = 0;
  offsetX: number = 0;
  offsetY: number = 0;
  listenersAdded: boolean = false;
  draggedElement: any;
  draggedPiece: any;
  
  canvas: any;

  isPieceMovable: Function;
  dragStart: Function;
  dragCompleted: Function;

  constructor() { }

  init(canvas: any, isPieceMovable, dragStart: Function, dragCompleted: Function) {
    this.canvas = canvas;
    this.isPieceMovable = isPieceMovable;
    this.dragStart = dragStart;
    this.dragCompleted = dragCompleted;
    this.addEventListeners();
  }

  private initCanvasSizeAndStartPositions = (boardSize) => {
    this.canvas.startX = 0;
    this.canvas.startY = 0;
    if (this.canvas.width < this.canvas.height) {
      this.canvas.startY = (this.canvas.height - this.canvas.width) / 2;
      this.canvas.size = this.canvas.width / boardSize;
    } else {
      this.canvas.startX = (this.canvas.width - this.canvas.height) / 2;
      this.canvas.size = this.canvas.height/ boardSize;
    }
  }

  private initCanvas = () => {
    let rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.addEventListeners();
  }

  updateCanvas(boardSize) {
    this.initCanvas();
    this.initCanvasSizeAndStartPositions(boardSize);
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

  mouseDown = (e) => {
    if (this.isDraggable(e.target)) {
      this.draggedPiece = this.dragStart(e.target);
      this.draggedElement = e.target;
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
        this.dragCompleted(this.draggedPiece);
        this.initialX = this.currentX;
        this.initialY = this.currentY;
        this.draggedElement = null;
        this.draggedPiece.element.style.zIndex = '10';
        this.draggedPiece = null;
    }
  } 

  setTranslate(xPos, yPos, element) {
    if (this.draggedElement) {
      this.draggedPiece.element.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
    }
  }

  isDraggable(element) {
    return this.isPiece(element) && this.isPieceMovable(element);
  }

  isPiece(element) {
    let index = element.getAttribute(ROW_ATTRIBUTE);
    return index !== null;
  }
}
