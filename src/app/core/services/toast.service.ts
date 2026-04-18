import { Injectable } from '@angular/core';
import { Toast } from '@capacitor/toast';

@Injectable({ providedIn: 'root' })
export class ToastService {

  async show(message: string, duration: 'short' | 'long' = 'short') {
    await Toast.show({
      text:     message,
      duration: duration,
      position: 'bottom',
    });
  }

  async success(message: string) { return this.show(message, 'short'); }
  async error(message: string)   { return this.show(message, 'long'); }
  async warning(message: string) { return this.show(message, 'short'); }
}