import { Injectable } from '@angular/core';

import {
  OFFSET_X_ATTR, 
  OFFSET_Y_ATTR,
  ROW_ATTRIBUTE,
  COL_ATTRIBUTE,
  PIECE_EDGE_OFFSET,
  TYPE_KING
} from '../util/constants';

@Injectable({
  providedIn: 'root'
})
export class UtilService {

  constructor() { }

  getCheckerElement = (canvas, row: number, col: number) => {
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

  getPieceElement(canvas, color: string, row: number, col: number, type: number) {
    const { startX, startY, size } = canvas;
    let circle = this.getCircle(row, col, color, size);
    let svgContainer = this.getSvgContainer(size);
    let pieceDivElem = this.getPieceDivElement(startX, startY, row, col, size);
    svgContainer.appendChild(circle);
    if (type !== TYPE_KING) {
      let kingCircle = this.getKingCircle(size);
      svgContainer.appendChild(kingCircle);
    }
    pieceDivElem.appendChild(svgContainer);
    return pieceDivElem;
  }

  getPieceDivElement(startX, startY, row, col, size) {
    let div = document.createElement('div');
    div.style.width = `${size}px`;
    div.style.height = `${size}px`;
    div.style.position = "absolute";
    div.style.left = `${startX + col*size}px`;
    div.style.top = `${startY + row*size}px`;
    div.style.zIndex = '10';
    return div;
  }

  getSvgContainer(size) {
    let svgNS = "http://www.w3.org/2000/svg";
    let svg = document.createElementNS(svgNS, "svg");
    svg.setAttributeNS(null,"width",`${size}`);
    svg.setAttributeNS(null,"height",`${size}`);
    return svg;
  }

  getKingCircle(size) {
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

  getStrokeWidth(radius) {
    let ratio = radius/5;
    if (ratio > 3) {
      return 5
    } else if (ratio > 2) {
      return 3;
    }
    return 1;
  }

  getCircle(row, col, color,  size) {
    let svgNS = "http://www.w3.org/2000/svg";
    let circle = document.createElementNS(svgNS, "circle");
    circle.setAttributeNS(null,"cx",`${size/2}`);
    circle.setAttributeNS(null,"cy",`${size/2}`);
    circle.setAttributeNS(null,"r",`${(size/2) - PIECE_EDGE_OFFSET}`);
    circle.setAttributeNS(null,"filter",`url(#MyFilter)`);
    circle.setAttributeNS(null,"fill", color);
    circle.addEventListener('mouseover', this.mouseOverEffect);
    circle.addEventListener('mouseout', this.mouseOutEffect);
    circle.setAttribute(ROW_ATTRIBUTE, row.toString());
    circle.setAttribute(COL_ATTRIBUTE, col.toString());
    circle.setAttribute(OFFSET_X_ATTR, '0');
    circle.setAttribute(OFFSET_Y_ATTR, '0'); 
    return circle;
  }

  mouseOverEffect = (e) => {
    e.target.setAttributeNS(null,"stroke-width","4");
    e.target.setAttributeNS(null,"stroke","green");
  }

  mouseOutEffect = (e) => {
    e.target.setAttributeNS(null,"stroke-width","0");
    e.target.setAttributeNS(null,"stroke","green");
  }

  getBackgroundChecker(row: number, col: number, width: number, height: number, size: number) {
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
}
