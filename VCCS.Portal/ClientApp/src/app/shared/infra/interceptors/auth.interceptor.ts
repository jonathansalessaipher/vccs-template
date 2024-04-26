import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from '../../services';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private _authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const authInfo = this._authService.authInfo;

    if (authInfo) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${authInfo.token}` },
      });

      return next.handle(req).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) {
            console.log('[x] 401 - Não autorizado');
            this._authService.logOut();
          }

          return throwError(error);
        })
      );
    }

    return next.handle(req);
  }

}
