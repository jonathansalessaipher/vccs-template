import { Injectable } from '@angular/core';
import themes from 'devextreme/ui/themes';
import { Themes } from '../enums';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private storageKey = 'app-theme';

  // public changeThemeEvent = new Subject<Themes>();

  constructor() { }

  changeTheme(theme?: string){
    if(!theme) {
      theme = this.getCurrentTheme();
    }

    themes.current(theme);
  }

  switchTheme(){
    let theme = this.getCurrentTheme();

    if(theme == Themes.Dark) {
      theme = Themes.Light;
    } else {
      theme = Themes.Dark;
    }

    this.changeTheme(theme);
    window.localStorage.setItem(this.storageKey, theme);
  }

  getCurrentTheme(){
    return localStorage.getItem(this.storageKey) || Themes.Dark;
  }

}
