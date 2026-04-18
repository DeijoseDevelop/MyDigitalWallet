import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class DialogService {

  constructor(private alertCtrl: AlertController) {}

  confirm(header: string, message: string): Promise<boolean> {
    return new Promise(async resolve => {
      const alert = await this.alertCtrl.create({
        header,
        message,
        buttons: [
          { text: 'Cancelar', role: 'cancel', handler: () => resolve(false) },
          { text: 'Aceptar',  role: 'confirm', handler: () => resolve(true) }
        ]
      });
      await alert.present();
    });
  }

  alert(header: string, message: string): Promise<void> {
    return new Promise(async resolve => {
      const alert = await this.alertCtrl.create({
        header,
        message,
        buttons: [{ text: 'OK', handler: () => resolve() }]
      });
      await alert.present();
    });
  }
}