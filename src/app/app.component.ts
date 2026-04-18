import { Component, OnDestroy } from '@angular/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { SplashScreen } from '@capacitor/splash-screen';
import { Platform } from '@ionic/angular';
import { PluginListenerHandle } from '@capacitor/core';
import { StorageService } from './core/services/storage.service';
import { HttpService } from './core/services/http.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnDestroy {

  private registrationListener?: PluginListenerHandle;
  private registrationErrorListener?: PluginListenerHandle;

  constructor(
    private platform: Platform,
    private storageService: StorageService,
    private httpService: HttpService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(async () => {

      await this.httpService.login().catch(err =>
        console.warn('No se pudo autenticar con la API de notificaciones:', err)
      );

      if (this.platform.is('capacitor')) {
        await this.registerNotifications();
      }

      await SplashScreen.hide({ fadeOutDuration: 500 });
    });
  }

  async registerNotifications() {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('El usuario denegó los permisos de notificación');
      return;
    }

    this.registrationListener = await PushNotifications.addListener(
      'registration',
      async token => {
        console.log('FCM TOKEN:', token.value);
        await this.storageService.set('fcm_token', token.value);
        await this.registrationListener?.remove();
        this.registrationListener = undefined;
      }
    );

    this.registrationErrorListener = await PushNotifications.addListener(
      'registrationError',
      async err => {
        console.error('Error al registrar el dispositivo:', err.error);
        await this.registrationErrorListener?.remove();
        this.registrationErrorListener = undefined;
      }
    );

    await PushNotifications.register();
  }

  async ngOnDestroy() {
    await this.registrationListener?.remove();
    await this.registrationErrorListener?.remove();
  }
}