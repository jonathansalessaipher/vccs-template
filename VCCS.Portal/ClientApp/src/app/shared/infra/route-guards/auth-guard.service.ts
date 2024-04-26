import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AuthService } from '../../services';

@Injectable({providedIn: 'root'})
export class AuthGuardService implements CanActivate {
  constructor(private router: Router, private authService: AuthService) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const isLoggedIn = this.authService.loggedIn;

    const isAuthForm = [
      'login-form',
      'create-account'
    ].includes(route.routeConfig?.data?.title);

    if (!isLoggedIn && isAuthForm) {
      return true;
    }

    if (isLoggedIn && isAuthForm) {
      this.router.navigate(['/']);
    }

    if (!isLoggedIn) {
      this.router.navigate(['/login-form']);
    }

    return isLoggedIn;
  }
}
