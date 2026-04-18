import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private auth: Auth) {
    this.initGoogleAuth();
  }

  private async initGoogleAuth() {
    await GoogleSignIn.initialize({
      clientId: environment.firebase.webId, 
      scopes: ['profile', 'email'], 
    });
  }

  async loginWithGoogle() {
    try {
      const result = await GoogleSignIn.signIn();

      console.log('Token recibido de Google:', result.idToken);
      console.log('Email del usuario:', result.email);
      
      return result;
    } catch (error) {
      console.error('Error en Google Sign-In', error);
      throw error;
    }
  }

  async register(email: string, password: string) {
    return await createUserWithEmailAndPassword(this.auth, email, password);
  }

  async login(email: string, password: string) {
    return await signInWithEmailAndPassword(this.auth, email, password);
  }

  async logout() {
    await signOut(this.auth);
    await GoogleSignIn.signOut();
  }
}