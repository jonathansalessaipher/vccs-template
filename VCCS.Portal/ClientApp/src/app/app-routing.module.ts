import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DxDataGridModule, DxFormModule } from 'devextreme-angular';

const routes: Routes = [

  {
    path: 'login-form',
    loadChildren: () => import("./pages/login/login.module" ).then(m => m.LoginModule)
  },
  {
    path: 'create-account',
    loadChildren: () => import("./pages/create-account/create-account.module" ).then(m => m.CreateAccountModule)
  },
  {
    path: 'home',
    loadChildren: () => import("./pages/home/home.module" ).then(m => m.HomeModule)
  },
  {
    path: 'vccs-vhf',
    loadChildren: () => import("./pages/vccs-vhf/vccs-vhf.module" ).then(m => m.VccsVhfModule)
  },
  {
    path: 'vccs-tf',
    loadChildren: () => import("./pages/vccs-tf/vccs-tf.module" ).then(m => m.VccsTfModule)
  },
  {
    path: 'products',
    loadChildren: () => import("./pages/products/products.module").then(m => m.ProductsModule)
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true }), DxDataGridModule, DxFormModule],
  exports: [RouterModule],
  declarations: [ ]
})
export class AppRoutingModule { }
