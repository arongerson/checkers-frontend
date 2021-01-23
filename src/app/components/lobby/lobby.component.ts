import { Component, OnInit } from '@angular/core';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss']
})
export class LobbyComponent implements OnInit {

  isCreator = false;
  gameCode: string;

  constructor(
    private storageService: StorageService
  ) { }

  ngOnInit() {
    this.isCreator = this.storageService.isCreator();
    this.gameCode = this.storageService.getGameCode();
  }

}
