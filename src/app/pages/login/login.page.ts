import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, LoadingController } from '@ionic/angular';
import { AuthService } from 'src/app/core/services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  email = '';
  password = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  async onLogin() {
    const loading = await this.loadingCtrl.create({ message: 'Ingresando...' });
    await loading.present();

    try {
      await this.authService.login(this.email, this.password);
      this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (error) {
      this.showToast('Error al iniciar sesión. Revisa tus datos.');
    } finally {
      loading.dismiss();
    }
  }

  async onGoogleLogin() {
    try {
      const user = await this.authService.loginWithGoogle();
      if (user) {
        this.router.navigateByUrl('/home', { replaceUrl: true });
      }
    } catch (error) {
      this.showToast('Error con Google Sign-In');
    }
  }

  async showToast(msg: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      color: 'danger'
    });
    toast.present();
  }
}