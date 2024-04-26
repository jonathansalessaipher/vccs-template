import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { throwError } from 'rxjs';
import {catchError, map, tap} from 'rxjs/operators'

import { IAuthInfo, IResponse } from '../interfaces';
import { ErrorHandler } from '../utils';

export interface IUser {
  email: string;
  avatarUrl?: string
}


@Injectable( {providedIn: 'root'})
export class AuthService extends ErrorHandler {

  private _AUTH_INFO_STORAGE = 'authInfo';

  private _baseUrl = 'v1/account';
  private _authInfo!: IAuthInfo | null;

  get authInfo() {
    return this._authInfo;
  }

  get loggedIn(): boolean {
    return !!this._authInfo;
  }

  constructor(private _router: Router, private _http: HttpClient) {
    super();
    this.getAccountInfo();
  }

  private getAccountInfo() {
    const aux =
      localStorage.getItem(this._AUTH_INFO_STORAGE) ||
      sessionStorage.getItem(this._AUTH_INFO_STORAGE);

    this._authInfo = JSON.parse(aux!)
  }

  logIn(email: string, password: string, keepMeConnected: boolean) {

    // ***************************************************************************
    // Mock
    // ***************************************************************************
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this._authInfo = {
          token: 'token',
          id: 1,
          name: "Thiago Gomes",
          email: 'mail@mail.com',
          profile: 'Admin'
        } as IAuthInfo;

        if(keepMeConnected) {
          localStorage.setItem(this._AUTH_INFO_STORAGE, JSON.stringify(this._authInfo));
        } else {
          sessionStorage.setItem(this._AUTH_INFO_STORAGE, JSON.stringify(this._authInfo));
        }

        resolve(true)
      }, 2000);
    })

    // ***************************************************************************
    // Exemplo real para uso da API template (Descomentar linhas abaixo)
    // ***************************************************************************
    // return this._http
    //   .post<IResponse<IAuthInfo>>(`${this._baseUrl}/login`, {email, password})
    //   .pipe(
    //     tap( response => {
    //       if(response.success) {
    //         this._authInfo = response.data!;

    //         if(keepMeConnected) {
    //           localStorage.setItem(this._AUTH_INFO_STORAGE, JSON.stringify(this._authInfo));
    //         } else {
    //           sessionStorage.setItem(this._AUTH_INFO_STORAGE, JSON.stringify(this._authInfo));
    //         }
    //       }
    //     }),
    //     map( response => response.success),
    //     catchError(this.handleError)
    //   )
    //   .toPromise();
  }

  createAccount(email: string, name: string, password: string) {

    // ***************************************************************************
    // Mock
    // ***************************************************************************
    return new Promise((resolve, reject) => {
      setTimeout( () => resolve(true), 2000)
    })

    // ***************************************************************************
    // Exemplo real para uso da API template (Descomentar linhas abaixo)
    // ***************************************************************************
    // return this._http
    //   .post<IResponse<string>>(`${this._baseUrl}/register`, {email, name, password})
    //   .pipe(
    //     map(response => response.success),
    //     catchError(this.handleError)
    //   )
    //   .toPromise();
  }

  async logOut() {
    this._authInfo = null;

    localStorage.removeItem(this._AUTH_INFO_STORAGE);
    sessionStorage.removeItem(this._AUTH_INFO_STORAGE);

    this._router.navigate(['/login-form']);
  }
}
