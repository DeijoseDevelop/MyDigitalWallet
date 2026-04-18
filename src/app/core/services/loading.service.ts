import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class LoadingService {

  private loadingEl: HTMLIonLoadingElement | null = null;

  constructor(private loadingCtrl: LoadingController) {}

  async show(message = 'Cargando...') {
    if (this.loadingEl) return;
    this.loadingEl = await this.loadingCtrl.create({ message, spinner: 'crescent' });
    await this.loadingEl.present();
  }

  async hide() {
    if (!this.loadingEl) return;
    await this.loadingEl.dismiss();
    this.loadingEl = null;
  }
}