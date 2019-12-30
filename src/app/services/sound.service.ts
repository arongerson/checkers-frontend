import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SoundService {

  private swoop: any;
  private capture: any;

  constructor() { 
    this.initSounds();
  }

  private initSounds() {
    this.swoop = this.createSoundClip("assets/sounds/swoop.wav");
    this.capture = this.createSoundClip("assets/sounds/capture.wav");
  }

  public playSwoop() {
    this.play(this.swoop);
  }

  public playCapture() {
    this.play(this.capture);
  }

  private play(sound) {
    sound.play();
  }

  private createSoundClip(src) {
    let sound = document.createElement("audio");
    sound.src = src;
    sound.setAttribute("preload", "auto");
    sound.setAttribute("controls", "none");
    sound.style.display = "none";
    document.body.appendChild(sound);
    return sound;
  }
}
