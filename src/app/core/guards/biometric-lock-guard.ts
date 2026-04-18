import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { getAuth } from 'firebase/auth';
import { FirestoreService } from '../services/firestore';
import { NativeBiometric } from 'capacitor-native-biometric';
import { Platform } from '@ionic/angular';

export const biometricLockGuard: CanActivateFn = async () => {
  const router    = inject(Router);
  const firestore = inject(FirestoreService);
  const platform  = inject(Platform);

  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) return router.createUrlTree(['/login']);

  if (!platform.is('capacitor')) return true;

  const userData = await firestore.getDocument('users', user.uid);
  if (!userData?.biometryEnabled) return true;

  try {
    const result = await NativeBiometric.isAvailable();
    if (!result.isAvailable) return true;

    await NativeBiometric.verifyIdentity({
      reason: 'Confirma tu identidad para continuar',
      title: 'Autenticación Biométrica',
      subtitle: 'MyDigitalWallet',
      description: 'Usa tu huella o rostro para acceder',
      negativeButtonText: 'Cancelar',
      maxAttempts: 3,
    });

    return true;
  } catch {
    return router.createUrlTree(['/login']);
  }
};