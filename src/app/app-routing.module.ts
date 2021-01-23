import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { WelcomeComponent } from './components/welcome/welcome.component';
import { PlayComponent } from './components/play/play.component';
import { LobbyComponent } from './components/lobby/lobby.component';


const routes: Routes = [
  {path: '', component: WelcomeComponent },
  {path: 'welcome', redirectTo: '/'},
  {path: 'play', component: PlayComponent},
  {path: 'lobby', component: LobbyComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
