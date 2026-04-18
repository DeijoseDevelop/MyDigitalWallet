import { Injectable } from '@angular/core';
import { NativeBiometric } from 'capacitor-native-biometric';
import { Platform } from '@ionic/angular';

const BIOMETRIC_SERVER = 'mydigitalwallet.app';

@Injectable({ providedIn: 'root' })
export class BiometricService {

  constructor(private platform: Platform) {}

  isNative(): boolean {
    return this.platform.is('capacitor');
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isNative()) return false;
    try {
      const result = await NativeBiometric.isAvailable();
      return result.isAvailable;
    } catch {
      return false;
    }
  }

  async verify(reason = 'Confirma tu identidad'): Promise<boolean> {
    try {
      await NativeBiometric.verifyIdentity({
        reason,
        title: 'Autenticación Biométrica',
        subtitle: 'MyDigitalWallet',
        description: 'Usa tu huella o rostro para continuar',
        negativeButtonText: 'Cancelar',
        maxAttempts: 3,
      });
      return true;
    } catch {
      return false;
    }
  }

  async saveCredentials(username: string, password: string): Promise<void> {
    await NativeBiometric.setCredentials({
      username,
      password,
      server: BIOMETRIC_SERVER,
    });
  }

  async getCredentials(): Promise<{ username: string; password: string } | null> {
    try {
      const creds = await NativeBiometric.getCredentials({ server: BIOMETRIC_SERVER });
      return creds;
    } catch {
      return null;
    }
  }

  async deleteCredentials(): Promise<void> {
    try {
      await NativeBiometric.deleteCredentials({ server: BIOMETRIC_SERVER });
    } catch {}
  }
}