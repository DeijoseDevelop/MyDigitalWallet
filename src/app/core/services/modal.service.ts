import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class ModalService {

  constructor(private modalCtrl: ModalController) {}

  async open(component: any, componentProps: Record<string, any> = {}): Promise<any> {
    const modal = await this.modalCtrl.create({ component, componentProps });
    await modal.present();
    const { data, role } = await modal.onWillDismiss();
    return { data, role };
  }

  async close(data?: any, role = 'confirm') {
    await this.modalCtrl.dismiss(data, role);
  }
}