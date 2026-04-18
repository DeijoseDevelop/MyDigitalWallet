// Importamos directamente del SDK de Firebase, NO de AngularFire
import { 
  getAuth, 
  signInWithCredential, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';
import { environment } from 'src/environments/environment';

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