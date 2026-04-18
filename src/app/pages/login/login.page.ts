import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, LoadingController, Platform } from '@ionic/angular';
import { AuthService } from 'src/app/core/services/auth.service';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { BiometricService } from 'src/app/core/services/biometric.service';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnInit {

  email        = '';
  password     = '';
  showPassword = false;
  showBiometricBtn = false;

  constructor(
    private authService: AuthService,
    private firestoreService: FirestoreService,
    private biometricService: BiometricService,
    private userService: UserService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private platform: Platform
  ) {}

  async ngOnInit() {
    await this.platform.ready();
    this.showBiometricBtn = await this.biometricService.isAvailable();
  }

  async onLogin() {
    const loading = await this.loadingCtrl.create({ message: 'Ingresando...' });
    await loading.present();
    try {
      await this.authService.login(this.email, this.password);
      this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (error: any) {
      const code = error?.code;
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        this.showToast('Correo o contraseña incorrectos.');
      } else if (code === 'auth/account-exists-with-different-credential') {
        this.showToast('Este correo está registrado con Google. Usa "Continuar con Google".');
      } else if (code === 'auth/too-many-requests') {
        this.showToast('Demasiados intentos. Intenta más tarde.');
      } else {
        this.showToast('Error al iniciar sesión. Revisa tus datos.');
      }
    } finally {
      loading.dismiss();
    }
  }

  async onBiometricLogin() {
    const available = await this.biometricService.isAvailable();
    if (!available) return;

    const verified = await this.biometricService.verify('Inicia sesión con tu huella');
    if (!verified) {
      this.showToast('Autenticación biométrica fallida.');
      return;
    }

    const creds = await this.biometricService.getCredentials();
    if (!creds) {
      this.showToast('No hay credenciales guardadas. Inicia sesión primero.');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Ingresando...' });
    await loading.present();
    try {
      await this.authService.login(creds.username, creds.password);
      this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch {
      this.showToast('Error al iniciar sesión con biometría.');
    } finally {
      loading.dismiss();
    }
  }

  async onGoogleLogin() {
    try {
      const user = await this.authService.loginWithGoogle();
      if (!user) return;
      const existing = await this.firestoreService.getDocument('users', user.uid);
      if (existing) {
        this.router.navigateByUrl('/home', { replaceUrl: true });
      } else {
        this.router.navigateByUrl('/complete-profile', { replaceUrl: true });
      }
    } catch {
      this.showToast('Error con Google Sign-In');
    }
  }

  async showToast(msg: string) {
    const toast = await this.toastCtrl.create({
      message: msg, duration: 2500, color: 'danger', position: 'bottom'
    });
    toast.present();
  }
}