import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompleteProfilePage } from './complete-profile.page';
import { SharedModule } from 'src/app/shared/shared-module';

const routes: Routes = [{ path: '', component: CompleteProfilePage }];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [CompleteProfilePage]
})
export class CompleteProfilePageModule {}