import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { getAuth } from 'firebase/auth';
import { FirestoreService } from '../services/firestore.service';
import { BiometricService } from '../services/biometric.service';

export const biometricLockGuard: CanActivateFn = async () => {
  const router    = inject(Router);
  const firestore = inject(FirestoreService);
  const biometric = inject(BiometricService);

  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) return router.createUrlTree(['/login']);
  if (!biometric.isNative()) return true;

  const userData = await firestore.getDocument('users', user.uid);
  if (!userData?.biometryEnabled) return true;

  const available = await biometric.isAvailable();
  if (!available) return true;

  const verified = await biometric.verify('Confirma tu identidad para acceder');
  return verified ? true : router.createUrlTree(['/login']);
};