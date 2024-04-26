import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { DxFormModule } from 'devextreme-angular/ui/form';
import { DxLoadIndicatorModule } from 'devextreme-angular/ui/load-indicator';
import notify from 'devextreme/ui/notify';

import { AuthService } from '../../../shared/services';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss'],
})
export class LoginFormComponent {
  loading = false;
  formData: any = {};

  constructor(private _authService: AuthService, private _router: Router) {}

  async onSubmit(e: Event) {

    e.preventDefault();

    try {
      const { email, password, keepMeConnected } = this.formData;
      this.loading = true;

      const result = await this._authService.logIn(email, password, keepMeConnected);

      if(result) {
        this._router.navigate(['/']);
        notify("Login realizado com sucesso!", "success", 3000);
        return
      }

      notify("Não foi possível fazer login!", "error", 3000);

    } catch (error) {
      notify(`Erro ao efetuar login. [${error}]`, "error", 5000);
    }
    finally {
      this.loading = false;
    }
  }

  onCreateAccountClick = () => {
    this._router.navigate(['/create-account']);
  };
}
@NgModule({
  imports: [CommonModule, RouterModule, DxFormModule, DxLoadIndicatorModule],
  declarations: [LoginFormComponent],
  exports: [LoginFormComponent],
})
export class LoginFormModule {}
