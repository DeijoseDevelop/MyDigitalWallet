import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DefaultCardPage } from './default-card.page';
import { SharedModule } from 'src/app/shared/shared-module';

const routes: Routes = [{ path: '', component: DefaultCardPage }];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [DefaultCardPage]
})
export class DefaultCardPageModule { }