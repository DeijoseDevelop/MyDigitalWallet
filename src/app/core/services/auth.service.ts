// Importamos directamente del SDK de Firebase, NO de AngularFire
import {
  getAuth,
  signInWithCredential,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  linkWithCredential,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';
import { environment } from 'src/environments/environment';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = getAuth();

  constructor() {
    this.initGoogleAuth();
  }

  private async initGoogleAuth() {
    await GoogleSignIn.initialize({
      clientId: environment.firebase.webId,
      scopes: ['profile', 'email'],
    });
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }

  async loginWithGoogle() {
    try {
      const googleResult = await GoogleSignIn.signIn();

      const credential = GoogleAuthProvider.credential(googleResult.idToken);
      const userCredential = await signInWithCredential(this.auth, credential);

      const firebaseJWT = await userCredential.user.getIdToken();

      console.log('🌟 TOKEN DE FIREBASE PARA EL PROFE:', firebaseJWT);

      return userCredential.user;
    } catch (error) {
      console.error('Error en Login:', error);
      throw error;
    }
  }

  getCurrentUserProfile() {
    const user = this.auth.currentUser;
    if (!user) return null;
    return {
      uid: user.uid,
      email: user.email ?? '',
      displayName: user.displayName ?? '',
      photoURL: user.photoURL ?? '',
    };
  }

  async linkPassword(email: string, password: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    const credential = EmailAuthProvider.credential(email, password);
    await linkWithCredential(user, credential);
  }

  async register(email: string, password: string) {
    return await createUserWithEmailAndPassword(this.auth, email, password);
  }

  async loginWithBiometric(email: string, password: string) {
    return await signInWithEmailAndPassword(this.auth, email, password);
  }

  async reauthenticate(password: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user || !user.email) throw new Error('No hay usuario autenticado');
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  }

  async login(email: string, password: string) {
    return await signInWithEmailAndPassword(this.auth, email, password);
  }

  async logout() {
    await signOut(this.auth);
    await GoogleSignIn.signOut();
  }
}