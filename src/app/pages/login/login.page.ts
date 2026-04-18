import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, Platform } from '@ionic/angular';
import { AuthService } from 'src/app/core/services/auth.service';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { BiometricService } from 'src/app/core/services/biometric.service';
import { UserService } from 'src/app/core/services/user.service';
import { ToastService } from 'src/app/core/services/toast.service';

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
    private toastService: ToastService,
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
        await this.toastService.error('Correo o contraseña incorrectos.');
      } else if (code === 'auth/account-exists-with-different-credential') {
        await this.toastService.error('Este correo está registrado con Google. Usa "Continuar con Google".');
      } else if (code === 'auth/too-many-requests') {
        await this.toastService.error('Demasiados intentos. Intenta más tarde.');
      } else {
        await this.toastService.error('Error al iniciar sesión. Revisa tus datos.');
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
      await this.toastService.error('Autenticación biométrica fallida.');
      return;
    }

    const creds = await this.biometricService.getCredentials();
    if (!creds) {
      await this.toastService.error('No hay credenciales guardadas. Inicia sesión primero.');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Ingresando...' });
    await loading.present();
    try {
      await this.authService.login(creds.username, creds.password);
      this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch {
      await this.toastService.error('Error al iniciar sesión con biometría.');
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
      await this.toastService.error('Error con Google Sign-In');
    }
  }
}
