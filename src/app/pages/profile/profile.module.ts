import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfilePage } from './profile.page';
import { SharedModule } from 'src/app/shared/shared-module';

const routes: Routes = [{ path: '', component: ProfilePage }];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [ProfilePage]
})
export class ProfilePageModule {}