import { Injectable } from '@angular/core';
import { FirestoreService } from './firestore';
import { AuthService } from './auth';

export interface UserProfile {
  uid: string;
  email: string;
  nombre: string;
  apellido: string;
  tipoDocumento: string;
  numeroDocumento: string;
  pais: string;
  balance: number;
  biometryEnabled: boolean;
  createdAt: any;
}

@Injectable({ providedIn: 'root' })
export class UserService {

  constructor(
    private firestoreService: FirestoreService,
    private authService: AuthService
  ) {}

  getCurrentUid(): string | null {
    return this.authService.getCurrentUser()?.uid ?? null;
  }

  async getUserData(): Promise<UserProfile | null> {
    const uid = this.getCurrentUid();
    if (!uid) return null;
    return this.firestoreService.getDocument('users', uid) as Promise<UserProfile>;
  }

  async updateUserData(data: Partial<UserProfile>): Promise<void> {
    const uid = this.getCurrentUid();
    if (!uid) return;
    await this.firestoreService.createDocument('users', uid, data);
  }

  async updateBalance(newBalance: number): Promise<void> {
    const uid = this.getCurrentUid();
    if (!uid) return;
    await this.firestoreService.createDocument('users', uid, { balance: newBalance });
  }
}