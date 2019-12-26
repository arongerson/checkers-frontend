import { Injectable } from '@angular/core';

import {
  OFFSET_X_ATTR, 
  OFFSET_Y_ATTR,
  ROW_ATTRIBUTE,
  COL_ATTRIBUTE,
  PIECE_EDGE_OFFSET
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
    let xlinkNS = "http://www.w3.org/1999/xlink";
    let svgNS = "http://www.w3.org/2000/svg";
    let svg = document.createElementNS(svgNS, "svg");
    let circle = document.createElementNS(svgNS, "circle");
    circle.setAttributeNS(null,"cx",`${size/2}`);
    circle.setAttributeNS(null,"cy",`${size/2}`);
    circle.setAttributeNS(null,"r",`${(size/2) - PIECE_EDGE_OFFSET}`);
    circle.setAttributeNS(null,"filter",`url(#MyFilter)`);
    circle.setAttributeNS(null,"fill", color);
    circle.addEventListener('mouseover', this.mouseOverEffect);
    circle.addEventListener('mouseout', this.mouseOutEffect);
    // circle.setAttributeNS(null,"stroke-width","4");
    // circle.setAttributeNS(null,"stroke","green");
    svg.appendChild(circle);
    svg.setAttributeNS(null,"width",`${size}`);
    svg.setAttributeNS(null,"height",`${size}`);
    let div = document.createElement('div');
    div.style.width = `${size}px`;
    div.style.height = `${size}px`;
    div.style.position = "absolute";
    div.style.left = `${startX + col*size}px`;
    div.style.top = `${startY + row*size}px`;
    div.style.zIndex = '10';
    circle.setAttribute(ROW_ATTRIBUTE, row.toString());
    circle.setAttribute(COL_ATTRIBUTE, col.toString());
    circle.setAttribute(OFFSET_X_ATTR, '0');
    circle.setAttribute(OFFSET_Y_ATTR, '0'); 
    div.style.backgroundColor = "red";
    div.appendChild(svg);
    return div;
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
