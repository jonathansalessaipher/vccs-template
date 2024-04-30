import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VccsVhfComponent } from './vccs-vhf.component';
import { DxButtonModule, DxPopupModule, DxSelectBoxModule, DxTextBoxModule } from 'devextreme-angular';
import { AuthGuardService } from 'src/app/shared/infra/route-guards';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: "",
    data: { title: 'VCCS VHF'},
    component: VccsVhfComponent,
    canActivate: [AuthGuardService]
  }
];

@NgModule({
  declarations: [
    VccsVhfComponent
  ],
  imports: [
    CommonModule,
    DxButtonModule,
    RouterModule.forChild(routes),
    DxPopupModule,
    DxSelectBoxModule,
    DxTextBoxModule
  ]
})
export class VccsVhfModule { }
