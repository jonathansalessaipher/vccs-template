import { Component, HostBinding, OnInit } from '@angular/core';
import config from 'devextreme/core/config';

import { AppInfoService, AuthService, ScreenService } from './shared/services';
import { SignalRService } from './shared/services/signal-r/signal-r.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @HostBinding('class') get getClass() {
    return Object.keys(this.screen.sizes).filter(cl => this.screen.sizes[cl]).join(' ');
  }

  constructor(private _signalRService: SignalRService,
    private authService: AuthService,
    private screen: ScreenService,
    public appInfo: AppInfoService) {

    // configuração global
		config({
			editorStylingMode: 'filled'
		});
  }

  ngOnInit(): void {
    this._signalRService.start('userToken');

  }

  isAuthenticated() {
    return this.authService.loggedIn;
  }
}
