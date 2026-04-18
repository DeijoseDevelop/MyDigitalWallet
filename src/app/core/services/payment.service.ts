import { Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { UserService } from './user.service';
import { faker } from '@faker-js/faker/locale/es';

export interface Transaction {
  id?: string;
  cardId: string;
  cardLast4: string;
  amount: number;
  description: string;
  merchant: string;
  category: string;
  status: 'success' | 'failed' | 'pending';
  date: any;
}

export interface FakeMerchant {
  name: string;
  amount: number;
  category: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {

  constructor(
    private firestoreService: FirestoreService,
    private userService: UserService
  ) {}

  generateFakeMerchants(count = 6): FakeMerchant[] {
    const categoryMerchants: Record<string, () => string> = {
      'Comida':     () => faker.helpers.arrayElement([
        'McDonald\'s', 'Burger King', 'Subway', 'Domino\'s Pizza',
        'KFC', 'Rappi Food', 'PizzaHut', faker.company.name()
      ]),
      'Transporte': () => faker.helpers.arrayElement([
        'Uber', 'InDrive', 'Cabify', 'MioBus', 'Transmilenio',
        'DiDi', faker.company.name()
      ]),
      'Servicios':  () => faker.helpers.arrayElement([
        'Netflix', 'Spotify', 'Claro', 'Movistar', 'ETB',
        'Codensa', 'Gas Natural', faker.company.name()
      ]),
      'Compras':    () => faker.helpers.arrayElement([
        'Falabella', 'Éxito', 'Jumbo', 'Alkosto', 'Amazon',
        'Mercado Libre', faker.company.name()
      ]),
      'Salud':      () => faker.helpers.arrayElement([
        'Droguería La Rebaja', 'Cafam', 'Compensar',
        'Clínica del Country', faker.company.name()
      ]),
      'Ocio':       () => faker.helpers.arrayElement([
        'Cine Colombia', 'Royal Films', 'Steam', 'PlayStation Store',
        'Xbox Game Pass', faker.company.name()
      ]),
    };

    const categories = Object.keys(categoryMerchants);

    return Array.from({ length: count }, () => {
      const category = faker.helpers.arrayElement(categories);
      const name     = categoryMerchants[category]();
      const amount   = faker.number.int({ min: 3000, max: 250000 });
      return { name, amount, category };
    });
  }

  async processPayment(
    cardId: string,
    cardLast4: string,
    amount: number,
    description: string,
    merchant: string,
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
      merchant,
      category,
      status: 'success',
      date: new Date()
    };

    const txId      = await this.firestoreService.addDocument(`users/${uid}/transactions`, transaction);
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