import { Injectable } from '@angular/core';
import { Point } from '..//model/interface';

import {
  OFFSET_X_ATTR, 
  OFFSET_Y_ATTR,
  ROW_ATTRIBUTE,
  COL_ATTRIBUTE,
  PIECE_EDGE_OFFSET,
  TYPE_KING
} from '../util/constants';
import { PathLocationStrategy } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class UtilService {

  constructor() { }

  public static getCheckerElement = (canvas, row: number, col: number) => {
    const { width, height, size, startX, startY} = canvas;
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
    let radius = (size/2) - PIECE_EDGE_OFFSET;
    circle.setAttributeNS(null,"cx",`${size/2}`);
    circle.setAttributeNS(null,"cy",`${size/2}`);
    circle.setAttributeNS(null,"r", `${radius}`);
    circle.setAttributeNS(null,"fill", 'none');
    circle.setAttributeNS(null,"stroke", 'white');
    let strokeWidth = this.getStrokeWidth(radius);
    circle.setAttributeNS(null,"stroke-width", `${strokeWidth}`);
    return circle;
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
    circle.setAttributeNS(null,"cx",`${size/2}`);
    circle.setAttributeNS(null,"cy",`${size/2}`);
    circle.setAttributeNS(null,"r",`${(size/2) - PIECE_EDGE_OFFSET}`);
    circle.setAttributeNS(null,"filter",`url(#MyFilter)`);
    circle.setAttributeNS(null,"fill", color);
    circle.addEventListener('mouseover', this.mouseOverEffect);
    circle.addEventListener('mouseout', this.mouseOutEffect);
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
    e.target.setAttributeNS(null,"stroke-width","4");
    e.target.setAttributeNS(null,"stroke","green");
  }

  public static mouseOutEffect = (e) => {
    e.target.setAttributeNS(null,"stroke-width","0");
    e.target.setAttributeNS(null,"stroke","green");
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
    piece.element.style.left = `${startX + piece.col * size}px`;
    piece.element.style.top = `${startY + piece.row * size}px`;
    piece.element.style.transform = 'none';
  }

  public static animate(piece, from: Point, to: Point) {
    let path = this.getPath(from, to);
    let time = 1000;
    let n = 100;
    for (let i = 0; i < n; i++) {
      let waitTime = Math.floor((time/n) * i);
      setTimeout(() => {
        let point = path[i];
        piece.element.style.left = `${point.x}px`;
        piece.element.style.top = `${point.y}px`;
      }, waitTime);
    }
  }

  public static getPath(from: Point, to: Point) {
    let m = this.getSlope(from, to);
    let n = 100;
    let increment = this.getXIncrement(from, to, n);
    let path: Point[] = [];
    for (let i = 0; i < n; i++) {
      let x = from.x + i*increment;
      let y = m*(i*increment) + from.y;
      path.push({x: x, y: y});
    }
    return path;
  }

  private static getSlope(from: Point, to: Point) {
    return (to.y - from.y)/(to.x - from.x);
  }

  private static getXIncrement(from: Point, to: Point, n: number) {
    return (to.x - from.x) / n;
  }

  public static getElementPoint(element) {
    let rect = element.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top
    };
  }
}
