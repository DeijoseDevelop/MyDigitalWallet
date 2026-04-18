import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

export type ToastColor = 'success' | 'danger' | 'warning' | 'primary' | 'dark';

@Injectable({ providedIn: 'root' })
export class ToastService {

  constructor(private toastCtrl: ToastController) {}

  async show(message: string, color: ToastColor = 'dark', duration = 3000) {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      color,
      position: 'bottom',
      buttons: [{ icon: 'close', role: 'cancel' }]
    });
    await toast.present();
  }

  success(message: string) { return this.show(message, 'success'); }
  error(message: string)   { return this.show(message, 'danger'); }
  warning(message: string) { return this.show(message, 'warning'); }
}