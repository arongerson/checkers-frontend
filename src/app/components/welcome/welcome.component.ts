import { Component, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { WebSocketsService } from '../../services/web-sockets.service';
import {
  ACTION_CHAT, ACTION_CONNECT, ACTION_CREATE, ACTION_ERROR, ACTION_JOIN,
  ACTION_LEAVE, ACTION_LOGIN, ACTION_OTHER_CONNECT, ACTION_PLAY, ACTION_REGISTER,
  ACTION_RESTART, ACTION_INFO, ACTION_CLOSED, ACTION_STARTED
} from '../../util/constants';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements OnInit, AfterViewInit {

  webSocket: any;
  joinName: string;
  gameCode: string;
  playerName: string;

  buttonDisabled = false;
  gameCreated = false;
  gameStarted = false;
  generatedCode: string;

  canvas: any;

  constructor(
    private socketService: WebSocketsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.gameCreated = this.socketService.initGameCreated();
    this.gameStarted = this.socketService.initGameStarted();
    this.generatedCode = this.socketService.getGameCode();
    this.connect();
  }

  ngAfterViewInit() {
    this.drawCheckers();
  }

  drawCheckers() {
    this.updateCheckers();
  }

  updateCheckers() {
    let element = document.getElementById('body');
    let firstChild = element.firstChild;
    element.innerHTML = '';
    element.appendChild(firstChild);
    let rect = element.getBoundingClientRect();
    let width = rect.width;
    let height = rect.height;
    let size = 4;
    for (let i = 0; i < Math.ceil(height/ size) + 1; i++) {
      for (let j = 0; j < Math.ceil(width/ size); j++) {
        let div = document.createElement('div');
        let actualWidth = ((j + 1) * size) < width ? size : width - (j * size);
        let actualHeight = ((i + 1) * size) < height ? size : height - (i * size);
        div.style.height = `${actualHeight}px`;
        div.style.width = `${actualWidth}px`;
        div.style.position = `absolute`;
        div.style.left = `${j * size}px`;
        div.style.top = `${i * size}px`;
        if ((i + j) % 2 == 0) {
          div.style.backgroundColor = `#111`;
        } else {
          div.style.backgroundColor = `#000`;
        }
        element.appendChild(div);
      }
    }
  }

  connect() {
    this.webSocket = this.socketService.initWebSocket();
    if (this.webSocket) {
      this.webSocket.onopen = this.onOpen;
      this.webSocket.onmessage = this.onMessage;
      this.webSocket.onerror = this.onError;
      this.webSocket.onclose = this.onClose;
    }
  }

  onOpen = (data) => {
    console.log('connected');
  }

  onMessage = (data) => {
    let payLoad = JSON.parse(data.data);
    let code = parseInt(payLoad.code);
    if (code === ACTION_RESTART) {
      console.log('game restarted: ' + JSON.stringify(data.data));
    } else if (code === ACTION_CREATE) {
      this.processGameCreated(payLoad.data);
    } else if (code === ACTION_JOIN) {
      this.processGameJoined(payLoad.data);
    } else if (code === ACTION_CHAT) {
      console.log('game chat: ' + JSON.stringify(data.data));
    } else if (code === ACTION_CONNECT) {
      console.log('game connect: ' + JSON.stringify(data.data));
      this.socketService.saveToken(payLoad.data);
    } else if (code === ACTION_ERROR) {
      console.log('game error: ' + JSON.stringify(data.data));
    } else if (code === ACTION_LEAVE) {
      console.log('game leave: ' + JSON.stringify(data.data));
    } else if (code === ACTION_LOGIN) {
      console.log('game login: ' + JSON.stringify(data.data));
    } else if (code === ACTION_OTHER_CONNECT) {
      console.log('game other connect: ' + JSON.stringify(data.data));
    } else if (code === ACTION_PLAY) {
      this.processPlay(payLoad.data);
    } else if (code === ACTION_REGISTER) {
      console.log('game register: ' + JSON.stringify(data.data));
    } else if (code === ACTION_INFO) {
      console.log('game info: ' + payLoad.data.info);
    } else if (code === ACTION_CLOSED) {
      console.log('game info: ' + payLoad.data.info);
    } else {
      console.log('game unknown code: ' + JSON.stringify(data.data));
    }
  }

  processPlay = (data) => {
    let content = JSON.parse(data);
    this.socketService.saveGameStarted();
    console.log(JSON.stringify(content));
    this.gameStarted = true;
    let checkers = content.checkers;
    this.initCanvas();
    this.initCanvasSizeAndStartPositions();
    for(let i = 0; i < checkers.length; i++) {
      let rowCheckers = checkers[i];
      for (let j = 0; j < rowCheckers.length; j++) {
        let checker = rowCheckers[j];
        let checkerElement = this.getChecker(i, j);
        this.canvas.appendChild(checkerElement);
        if (checker.hasOwnProperty('piece')) {
          let piece = checker.piece;
          let owner = piece.owner;
          let color = (owner.id === 0) ? 'yellow' : 'black';
          let pieceElement = this.getPiece(color, i, j, piece.type);
          this.canvas.appendChild(pieceElement);
        }
      }
    }
  }

  initCanvasSizeAndStartPositions = () => {
    this.canvas.startX = 0;
    this.canvas.startY = 0;
    if (this.canvas.width < this.canvas.height) {
      this.canvas.startY = (this.canvas.height - this.canvas.width) / 2;
      this.canvas.size = this.canvas.width / 8;
    } else {
      this.canvas.startX = (this.canvas.width - this.canvas.height) / 2;
      this.canvas.size = this.canvas.height/8;
    }
  }

  getChecker = (i: number, j: number) => {
    let canvas = this.canvas;
    const { width, height, size, startX, startY} = canvas;
    let div = document.createElement('div');
    let actualWidth = ((j + 1) * canvas.size) < width ? size : width - (j * size);
    let actualHeight = ((i + 1) * size) < height ? size : height - (i * size);
    div.style.height = `${actualHeight}px`;
    div.style.width = `${actualWidth}px`;
    div.style.position = `absolute`;
    div.style.left = `${startX + j * size}px`;
    div.style.top = `${startY + i * size}px`;
    let color = (i + j) % 2 == 0 ? 'crimson' : 'white';
    div.style.backgroundColor = color;
    return div;
  }

  getPiece(color: string, row: number, col: number, type: number) {
    const { startX, startY, size } = this.canvas;
    let xlinkNS = "http://www.w3.org/1999/xlink";
    let svgNS = "http://www.w3.org/2000/svg";
    let svg = document.createElementNS(svgNS, "svg");
    var circle = document.createElementNS(svgNS, "circle");
    circle.setAttributeNS(null,"cx",`${size/2}`);
    circle.setAttributeNS(null,"cy",`${size/2}`);
    circle.setAttributeNS(null,"r",`${(size/2) - 10}`);
    circle.setAttributeNS(null,"fill", color);
    circle.setAttributeNS(null,"stroke-width","4");
    circle.setAttributeNS(null,"stroke","green");
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
    // div.style.backgroundColor = "transparent";
    div.appendChild(svg);
    return div;
  }

  initCanvas = () => {
    this.canvas = document.getElementById('canvas');
    let rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  getWidthAndHeight = () => {
    
  }

  updateView = (data) => {

  }

  processGameCreated = (data) => {
    let content = JSON.parse(data);
    this.socketService.saveGameCreated();
    this.generatedCode = content.gameCode;
    this.socketService.saveGameCode(this.generatedCode);
    this.socketService.savePlayerId(content.playerId);
    this.buttonDisabled = false;
    this.gameCreated = true;
  }

  processGameJoined = (data) => {
    let content = JSON.parse(data);
    this.socketService.savePlayerId(content.playerId);
    this.buttonDisabled = false;
    this.gameStarted = true;
  }

  createGame(playerName: string) {
    this.buttonDisabled = true;
    this.webSocket.send(JSON.stringify(
      {
        code: ACTION_CREATE,
        data: playerName
      }
    ));
  }

  joinGame(playerName: string, gameCode: string) {
    this.buttonDisabled = true;
    this.webSocket.send(JSON.stringify(
      {
        code: ACTION_JOIN,
        data: JSON.stringify(
          {
            name: playerName,
            code: gameCode
          }
        )
      }
    ));
    console.log(playerName, gameCode);
  }

  deleteGame() {

  }

  onError = (e) => {
    console.log('error');
  }

  onClose = () => {
    console.log('closed connection');
  }

  create() {
    this.createGame(this.playerName);
  }

  join() {
    this.joinGame(this.joinName, this.gameCode);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.updateCheckers();
  }

}

