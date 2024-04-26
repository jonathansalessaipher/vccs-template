import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DxDataGridModule } from 'devextreme-angular';
import { AuthGuardService } from 'src/app/shared/infra/route-guards';
import { ProductsService } from 'src/app/shared/services';

import { ProductsComponent } from './products.component';

const routes: Routes = [
  {
    path: "",
    component: ProductsComponent,
    canActivate: [AuthGuardService]
  }
]
@NgModule({
  declarations: [
    ProductsComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    DxDataGridModule
  ],
  providers: [ProductsService],
  exports: [RouterModule]
})
export class ProductsModule { }
