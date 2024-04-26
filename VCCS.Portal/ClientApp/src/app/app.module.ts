import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { NgxUiLoaderHttpModule, NgxUiLoaderModule } from 'ngx-ui-loader';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ApiUrlInterceptor, AuthInterceptor } from './shared/infra/interceptors';
import { SideNavOuterToolbarModule, SingleCardModule } from './shared/layouts';
import { FooterModule } from './shared/layouts/footer/footer.component';
import { AppInfoService, ScreenService } from './shared/services';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    SideNavOuterToolbarModule,
    SingleCardModule,
    FooterModule,
    AppRoutingModule,
    ToastrModule.forRoot(),
    NgxUiLoaderModule.forRoot({ fgsColor: "#03A9F4", fgsPosition: "center-center", fgsType: "circle", pbColor: "#03A9F4",}),
    NgxUiLoaderHttpModule.forRoot({ showForeground: true, exclude: [""] }),
    BrowserAnimationsModule
  ],
  providers: [
    ScreenService,
    AppInfoService,
    // {
    //   provide: DATE_PIPE_DEFAULT_OPTIONS,
    //   useValue: {timezone: 'UTC'}
    // },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ApiUrlInterceptor,
      multi: true,
      deps: [ToastrService]
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
