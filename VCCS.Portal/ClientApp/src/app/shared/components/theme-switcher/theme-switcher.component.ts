
import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit } from '@angular/core';
import { DxButtonModule } from 'devextreme-angular';
import { ThemeService } from '../../services';
import { NgxUiLoaderService } from 'ngx-ui-loader';



@Component({
  selector: 'app-theme-switcher',
  template: `
    <dx-button
      class="theme-button"
      stylingMode="text"
      [icon]="themeService.getCurrentTheme() !== 'material.blue.dark.compact' ? moonIconPath : sunIconPath"
      (onClick)="onButtonClick()"
    ></dx-button>
`,
  styleUrls: [],
})
export class ThemeSwitcherComponent implements OnInit {

  moonIconPath = '../../../../assets/icons/moon_dark.png';
  sunIconPath = '../../../../assets/icons/sun_white.png';

  constructor(public themeService: ThemeService, private _ngxService: NgxUiLoaderService) { }

  ngOnInit() {
    this.themeService.changeTheme();
  }

  onButtonClick () {
    this._ngxService.start()

    setTimeout(() => {
      this._ngxService.stop()
    }, 300)

    setTimeout(() => {
      this.themeService.switchTheme();
    }, 100)
  }
}

@NgModule({
  imports: [CommonModule, DxButtonModule],
  declarations: [ThemeSwitcherComponent],
  exports: [ThemeSwitcherComponent],
})
export class ThemeSwitcherModule { }
