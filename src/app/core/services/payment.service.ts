import { Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { UserService } from './user.service';

export interface Transaction {
  id?: string;
  cardId: string;
  cardLast4: string;
  amount: number;
  description: string;
  category: string;
  status: 'success' | 'failed' | 'pending';
  date: any;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {

  constructor(
    private firestoreService: FirestoreService,
    private userService: UserService
  ) {}

  async processPayment(
    cardId: string,
    cardLast4: string,
    amount: number,
    description: string,
    category: string
  ): Promise<Transaction> {
    const uid = this.userService.getCurrentUid();
    if (!uid) throw new Error('Usuario no autenticado');

    const userData = await this.userService.getUserData();
    if (!userData) throw new Error('No se encontró el perfil del usuario');

    if (userData.balance < amount) {
      throw new Error('Saldo insuficiente');
    }

    const transaction: Omit<Transaction, 'id'> = {
      cardId,
      cardLast4,
      amount,
      description,
      category,
      status: 'success',
      date: new Date()
    };

    const txId = await this.firestoreService.addDocument(`users/${uid}/transactions`, transaction);
    const newBalance = userData.balance - amount;
    await this.userService.updateBalance(newBalance);

    return { ...transaction, id: txId };
  }

  async getTransactions(): Promise<Transaction[]> {
    const uid = this.userService.getCurrentUid();
    if (!uid) return [];
    const txs = await this.firestoreService.getCollection(`users/${uid}/transactions`);

    return txs.sort((a, b) => b.date?.toMillis?.() - a.date?.toMillis?.() || 0);
  }
}