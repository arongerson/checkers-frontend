import { Injectable } from '@angular/core';
import { Point } from '..//model/interface';
import { StorageService } from './storage.service';

import {
  OFFSET_X_ATTR, 
  OFFSET_Y_ATTR,
  ROW_ATTRIBUTE,
  COL_ATTRIBUTE,
  PIECE_EDGE_OFFSET,
  TYPE_KING,
  ANIMATION_TIME,
  ANIMATION_DELAY,
  NUMBER_OF_FRAMES,
  CREATOR_ID
} from '../util/constants';
import { PathLocationStrategy } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class UtilService {

  constructor() { }

  public static getCheckerElement = (canvas, row: number, col: number) => {
    const { width, height, size, startX, startY} = canvas;
    row = UtilService.transformValue(row);
    col = UtilService.transformValue(col);
    let div = document.createElement('div');
    let actualWidth = ((col + 1) * canvas.size) < width ? size : width - (col * size);
    let actualHeight = ((row + 1) * size) < height ? size : height - (row * size);
    div.style.height = `${actualHeight}px`;
    div.style.width = `${actualWidth}px`;
    div.style.position = `absolute`;
    div.style.left = `${startX + col * size}px`;
    div.style.top = `${startY + row * size}px`;
    let color = (row + col) % 2 == 0 ? '#111' : '#ccc';
    div.style.backgroundColor = color;
    return div;
  }

  public static getPieceElement(canvas, color: string, row: number, col: number, type: number) {
    const { startX, startY, size } = canvas;
    row = UtilService.transformValue(row);
    col = UtilService.transformValue(col);
    let circle = this.getCircle(row, col, color, size);
    let svgContainer = this.getSvgContainer(size);
    let pieceDivElem = this.getPieceDivElement(startX, startY, row, col, size);
    svgContainer.appendChild(circle);
    if (type === TYPE_KING) {
      let kingCircle = this.getKingCircle(size);
      svgContainer.appendChild(kingCircle);
    }
    pieceDivElem.appendChild(svgContainer);
    return pieceDivElem;
  }

  public static getPieceDivElement(startX, startY, row, col, size) {
    let div = document.createElement('div');
    div.style.width = `${size}px`;
    div.style.height = `${size}px`;
    div.style.position = "absolute";
    div.style.left = `${startX + col*size}px`;
    div.style.top = `${startY + row*size}px`;
    div.style.zIndex = '10';
    return div;
  }

  public static getSvgContainer(size) {
    let svgNS = "http://www.w3.org/2000/svg";
    let svg = document.createElementNS(svgNS, "svg");
    svg.setAttributeNS(null,"width",`${size}`);
    svg.setAttributeNS(null,"height",`${size}`);
    return svg;
  }

  public static getKingCircle(size) {
    let svgNS = "http://www.w3.org/2000/svg";
    let circle = document.createElementNS(svgNS, "circle");
    let edgeOffset = this.getPieceEdgeOffset(size);
    let radius = (size/2) - edgeOffset;
    circle.setAttributeNS(null,"cx",`${size/2}`);
    circle.setAttributeNS(null,"cy",`${size/2}`);
    circle.setAttributeNS(null,"r", `${radius}`);
    circle.setAttributeNS(null,"fill", 'none');
    circle.setAttributeNS(null,"stroke", 'white');
    let strokeWidth = this.getStrokeWidth(radius);
    circle.setAttributeNS(null,"stroke-width", `${strokeWidth}`);
    return circle;
  }

  public static getPieceEdgeOffset(size) {
    return size / 9;
  }

  public static setKingCircle(piece) {
    let divElement = piece.element;
    let svgContainer = divElement.firstChild;
    let kingCircle = this.getKingCircle(svgContainer.clientWidth);
    svgContainer.appendChild(kingCircle);
  }

  public static getStrokeWidth(radius) {
    let ratio = radius/5;
    if (ratio > 3) {
      return 5
    } else if (ratio > 2) {
      return 3;
    }
    return 1;
  }

  public static getCircle(row, col, color,  size) {
    let svgNS = "http://www.w3.org/2000/svg";
    let circle = document.createElementNS(svgNS, "circle");
    let edgeOffset = this.getPieceEdgeOffset(size);
    let radius = (size/2) - edgeOffset;
    circle.setAttributeNS(null,"cx",`${size/2}`);
    circle.setAttributeNS(null,"cy",`${size/2}`);
    circle.setAttributeNS(null,"r",`${radius}`);
    circle.setAttributeNS(null,"filter",`url(#MyFilter)`);
    circle.setAttributeNS(null,"fill", color);
    circle.addEventListener('mouseover', this.mouseOverEffect);
    circle.addEventListener('mouseout', this.mouseOutEffect);
    // row and col should be transformed back to true values since they are 
    // not for display
    row = UtilService.transformValue(row);
    col = UtilService.transformValue(col);
    this.setCircleAttributes(circle, row, col, 0, 0);
    return circle;
  }

  public static setCircleAttributes(circle, row, col, xOffset, yOffset) {
    circle.setAttribute(ROW_ATTRIBUTE, `${row}`);
    circle.setAttribute(COL_ATTRIBUTE, `${col}`);
    circle.setAttribute(OFFSET_X_ATTR, `${xOffset}`);
    circle.setAttribute(OFFSET_Y_ATTR, `${yOffset}`); 
  }

  public static mouseOverEffect = (e) => {
    e.target.setAttributeNS(null,"opacity","0.7");
  }

  public static mouseOutEffect = (e) => {
    e.target.setAttributeNS(null,"opacity","1");
  }

  public static getBackgroundChecker(row: number, col: number, width: number, height: number, size: number) {
    let div = document.createElement('div');
    let actualWidth = ((col + 1) * size) < width ? size : width - (col * size);
    let actualHeight = ((row + 1) * size) < height ? size : height - (row * size);
    div.style.height = `${actualHeight}px`;
    div.style.width = `${actualWidth}px`;
    div.style.position = `absolute`;
    div.style.left = `${col * size}px`;
    div.style.top = `${row * size}px`;
    let color = ((row + col) % 2 == 0) ? '#111' : '#000';
    div.style.backgroundColor = color;
    return div;
  }

  public static positionElementOnTheBoard(piece, canvas) {
    const {startX, startY, size} = canvas;
    let row = UtilService.transformValue(piece.row);
    let col = UtilService.transformValue(piece.col);
    piece.element.style.left = `${startX + col * size}px`;
    piece.element.style.top = `${startY + row * size}px`;
    piece.element.style.transform = 'none';
  }

  public static animate(piece, from: Point, to: Point) {
    let path = this.getPath(from, to);
    for (let i = 0; i < NUMBER_OF_FRAMES; i++) {
      let waitTime = Math.floor((ANIMATION_TIME/NUMBER_OF_FRAMES) * i);
      setTimeout(() => {
        let point = path[i];
        piece.element.style.left = `${point.x}px`;
        piece.element.style.top = `${point.y}px`;
      }, waitTime);
    }
  }

  public static getPath(from: Point, to: Point) {
    let m = this.getSlope(from, to);
    let increment = this.getXIncrement(from, to);
    let path: Point[] = [];
    for (let i = 1; i <= NUMBER_OF_FRAMES; i++) {
      let x = from.x + i*increment;
      let y = m*(i*increment) + from.y;
      path.push({x: x, y: y});
    }
    return path;
  }

  private static getSlope(from: Point, to: Point) {
    return (to.y - from.y)/(to.x - from.x);
  }

  private static getXIncrement(from: Point, to: Point) {
    return (to.x - from.x) / NUMBER_OF_FRAMES;
  }

  public static getElementPoint(element) {
    let rect = element.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top
    };
  }

  // the board has to be rotated 180 degrees for the creator
  // the rows and cols are transformed for anything that has to be shown on the screen 
  private static transformValue(value) {
    let playerId = StorageService.getPlayerId();
    let boardSize = 8;
    if (playerId === CREATOR_ID) {
      return boardSize - value - 1;
    }
    return value;
  }
}
