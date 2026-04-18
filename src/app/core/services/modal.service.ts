import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class ModalService {

  constructor(private modalCtrl: ModalController) { }

  async open(component: any, componentProps: Record<string, any> = {}, bottomSheet = false): Promise<any> {
    const modal = await this.modalCtrl.create({
      component,
      componentProps,
      ...(bottomSheet ? {
        breakpoints: [0, 0.5, 0.92],
        initialBreakpoint: 0.92,
        handle: true,
        handleBehavior: 'cycle',
        backdropDismiss: true,
        backdropBreakpoint: 0.5,
      } : {})
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss();
    return { data, role };
  }

  async close(data?: any, role = 'confirm') {
    await this.modalCtrl.dismiss(data, role);
  }
}