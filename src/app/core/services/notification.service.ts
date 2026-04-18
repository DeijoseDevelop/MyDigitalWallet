import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { StorageService } from './storage.service';

export interface PushPayload {
  token: string;
  notification: { title: string; body: string };
  android?: { priority: string; data?: Record<string, string> };
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

  constructor(
    private httpService: HttpService,
    private secureStorage: StorageService
  ) {}

  async sendPaymentNotification(amount: number): Promise<void> {
    const token = await this.secureStorage.get('fcm_token');
    if (!token) {
      console.warn('No hay FCM token almacenado');
      return;
    }

    const payload: PushPayload = {
      token,
      notification: {
        title: 'Pago Exitoso',
        body: `Has realizado un pago de $${amount.toLocaleString('es-CO')}`
      },
      android: {
        priority: 'high',
        data: { key: 'value' }
      }
    };

    await this.httpService.sendNotification(payload);
  }

  async sendCustomNotification(title: string, body: string): Promise<void> {
    const token = await this.secureStorage.get('fcm_token');
    if (!token) return;

    const payload: PushPayload = { token, notification: { title, body } };
    await this.httpService.sendNotification(payload);
  }
}