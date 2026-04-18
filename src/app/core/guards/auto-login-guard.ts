import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { getAuth } from 'firebase/auth';

export const autoLoginGuard: CanActivateFn = () => {
  const auth = getAuth();
  const router = inject(Router);

  if (auth.currentUser) {
    return router.createUrlTree(['/home']);
  }
  return true;
};