import { Injectable } from '@angular/core';
import {
  getFirestore,
  doc, setDoc, getDoc,
  collection, addDoc, getDocs, updateDoc
} from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class FirestoreService {

  private db = getFirestore();

  async createDocument(collectionPath: string, docId: string, data: any): Promise<void> {
    const documentRef = doc(this.db, `${collectionPath}/${docId}`);
    await setDoc(documentRef, data, { merge: true });
  }

  async getDocument(collectionPath: string, docId: string): Promise<any> {
    const documentRef = doc(this.db, `${collectionPath}/${docId}`);
    const docSnap = await getDoc(documentRef);
    return docSnap.exists() ? { id: docSnap.id, ...(docSnap.data() as Record<string, any>) } : null;
  }

  async addDocument(collectionPath: string, data: any): Promise<string> {
    const collectionRef = collection(this.db, collectionPath);
    const docRef = await addDoc(collectionRef, data);
    return docRef.id;
  }

  async getCollection(collectionPath: string): Promise<any[]> {
    const collectionRef = collection(this.db, collectionPath);
    const snapshot = await getDocs(collectionRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Record<string, any>) }));
  }

  async updateDocument(collectionPath: string, docId: string, data: any): Promise<void> {
    const documentRef = doc(this.db, `${collectionPath}/${docId}`);
    await updateDoc(documentRef, data);
  }
}