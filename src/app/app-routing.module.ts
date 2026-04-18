import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { autoLoginGuard } from './core/guards/auto-login-guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule),
    canActivate: [autoLoginGuard]
  },
  {
    path: 'register',
    loadChildren: () => import('./pages/register/register.module').then(m => m.RegisterPageModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then(m => m.HomePageModule),
    canActivate: [authGuard]
  },
  {
    path: 'add-card',
    loadChildren: () => import('./pages/add-card/add-card.module').then(m => m.AddCardPageModule),
    canActivate: [authGuard]
  },
  {
    path: 'payment',
    loadChildren: () => import('./pages/payment/payment.module').then(m => m.PaymentPageModule),
    canActivate: [authGuard]
  },
  {
    path: 'complete-profile',
    loadChildren: () => import('./pages/complete-profile/complete-profile.module')
      .then(m => m.CompleteProfilePageModule),
    canActivate: [authGuard]
  },
  {
    path: 'complete-profile',
    loadChildren: () => import('./pages/complete-profile/complete-profile.module').then(m => m.CompleteProfilePageModule)
  },
  {
    path: 'profile',
    loadChildren: () => import('./pages/profile/profile.module')
      .then(m => m.ProfilePageModule),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadChildren: () => import('./pages/profile/profile.module').then( m => m.ProfilePageModule)
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule { }