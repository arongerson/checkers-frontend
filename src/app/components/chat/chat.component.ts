import { Component, OnInit, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { WebSocketsService } from '../../services/web-sockets.service';
import { Chat } from '../../model/interface';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ChatComponent implements OnInit {

  @Input() 
  newMessage: string = '';

  @Output() 
  event = new EventEmitter();

  messages: string[] = [];
  text: string = "";
  chatDiv: HTMLDivElement;
  savedChats: Chat[] = [];

  constructor(
    private socket: WebSocketsService,
    private storage: StorageService
  ) { }

  ngOnInit() {
    this.chatDiv = document.getElementById('chats') as HTMLDivElement;
    this.initChats();
  }

  initChats() {
    this.savedChats = this.storage.getSavedChats();
  }

  ngOnChanges() {
    if (this.chatDiv && this.newMessage !== '') {
      this.messages.push(this.newMessage);
      let element = this.createChatElement(this.newMessage, false);
      this.chatDiv.appendChild(element);
      this.chatDiv.scrollTop = this.chatDiv.scrollHeight;
      this.savedChats.push();
      this.storage.saveChat({isYours: false, text: this.newMessage});
    }
    this.newMessage = '';
  }

  send() {
    this.text = this.text.trim();
    if (this.text !== '') {
      this.socket.sendChat(this.text);
      this.storage.saveChat({isYours: true, text: this.text});
      let element = this.createChatElement(this.text, true);
      this.chatDiv.appendChild(element);
      this.chatDiv.scrollTop = this.chatDiv.scrollHeight;
      this.text = '';
    }
  }

  createChatElement(text: string, yourMessage: boolean) {
    let element = document.createElement('div') as any;
    element.innerHTML = text;
    let backgroundColor = yourMessage ? '#00b0ff' : 'palegreen';
    let align = yourMessage ? 'flex-end' : 'flex-start';
    element.style.maxWidth = '65%';
    element.style.padding = '0.7rem';
    element.style.marginBottom = '0.8rem';
    element.style.borderRadius = '0.6rem';
    element.style.overflowWrap = 'break-word';
    element.style.backgroundColor = backgroundColor;
    element.style.alignSelf = align;
    return element;
  }

  onFocus(event) {
    this.event.emit();
  }

}
