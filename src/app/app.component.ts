import { Component } from '@angular/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(private platform: Platform) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      if (this.platform.is('capacitor')) {
        this.registerNotifications();
      } else {
        console.log('Las notificaciones Push nativas solo funcionan en un dispositivo móvil.');
      }
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

    await PushNotifications.addListener('registration', token => {
      console.log('--- FCM TOKEN DEL DISPOSITIVO (PARA POSTMAN) ---');
      console.log(token.value);
      console.log('------------------------------------------------');
    });

    await PushNotifications.addListener('registrationError', err => {
      console.error('Error al registrar el dispositivo: ', err.error);
    });

    await PushNotifications.register();
  }
}
