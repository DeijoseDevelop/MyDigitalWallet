import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { getAuth } from 'firebase/auth';

export const authGuard: CanActivateFn = () => {
  const auth = getAuth();
  const router = inject(Router);

  if (auth.currentUser) {
    return true;
  }
  return router.createUrlTree(['/login']);
};