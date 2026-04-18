import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { AuthService } from 'src/app/core/services/auth.service';
import { UserService, UserProfile } from 'src/app/core/services/user.service';
import { BiometricService } from 'src/app/core/services/biometric.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { DialogService } from 'src/app/core/services/dialog.service';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false
})
export class ProfilePage implements OnInit {

  user: UserProfile | null = null;
  biometricAvailable = false;
  loading = true;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private biometricService: BiometricService,
    private toastService: ToastService,
    private dialogService: DialogService,
    private loadingCtrl: LoadingController,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadData();
  }

  async ionViewWillEnter() {
    await this.loadData();
  }

  async loadData() {
    this.loading = true;
    try {
      this.user               = await this.userService.getUserData();
      this.biometricAvailable = await this.biometricService.isAvailable();
    } finally {
      this.loading = false;
    }
  }

  async onToggleBiometric() {
    if (!this.user) return;
    await Haptics.impact({ style: ImpactStyle.Light });

    if (this.user.biometryEnabled) {
      await this.disableBiometric();
    } else {
      await this.enableBiometric();
    }
  }

  private async enableBiometric() {
    const password = await this.dialogService.prompt(
      'Confirma tu contraseña',
      'Por seguridad, ingresa tu contraseña para activar la biometría.',
      'Contraseña'
    );
    if (!password) return;

    const loading = await this.loadingCtrl.create({ message: 'Verificando...' });
    await loading.present();

    try {
      await this.authService.reauthenticate(password);

      const verified = await this.biometricService.verify(
        'Registra tu huella para acceso rápido'
      );
      if (!verified) {
        await this.toastService.error('No se pudo verificar la biometría.');
        return;
      }

      const profile = this.authService.getCurrentUserProfile();
      if (profile?.email) {
        await this.biometricService.saveCredentials(profile.email, password);
      }

      await this.userService.updateUserData({ biometryEnabled: true });
      this.user!.biometryEnabled = true;

      await Haptics.impact({ style: ImpactStyle.Medium });
      await this.toastService.success('Biometría activada correctamente.');
    } catch (error: any) {
      if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        await this.toastService.error('Contraseña incorrecta.');
      } else {
        await this.toastService.error('Error al activar la biometría.');
      }
    } finally {
      loading.dismiss();
    }
  }

  private async disableBiometric() {
    const confirmed = await this.dialogService.confirm(
      'Desactivar biometría',
      '¿Estás seguro? Tendrás que ingresar tu contraseña para acceder.'
    );
    if (!confirmed) return;

    const loading = await this.loadingCtrl.create({ message: 'Desactivando...' });
    await loading.present();

    try {
      await this.biometricService.deleteCredentials();
      await this.userService.updateUserData({ biometryEnabled: false });
      this.user!.biometryEnabled = false;
      await this.toastService.success('Biometría desactivada.');
    } catch {
      await this.toastService.error('Error al desactivar la biometría.');
    } finally {
      loading.dismiss();
    }
  }

  async onLogout() {
    const confirmed = await this.dialogService.confirm(
      'Cerrar sesión',
      '¿Estás seguro de que quieres salir?'
    );
    if (confirmed) {
      await Haptics.impact({ style: ImpactStyle.Medium });
      await this.authService.logout();
      this.router.navigateByUrl('/login', { replaceUrl: true });
    }
  }
}
