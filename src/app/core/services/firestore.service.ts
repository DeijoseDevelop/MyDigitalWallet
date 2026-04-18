import { Injectable } from '@angular/core';
import { Firestore, doc, setDoc, getDoc, collection, addDoc, getDocs, updateDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class FirestoreService {

  constructor(private firestore: Firestore) {}

  async createDocument(collectionPath: string, docId: string, data: any): Promise<void> {
    const documentRef = doc(this.firestore, `${collectionPath}/${docId}`);
    await setDoc(documentRef, data, { merge: true });
  }

  async getDocument(collectionPath: string, docId: string): Promise<any> {
    const documentRef = doc(this.firestore, `${collectionPath}/${docId}`);
    const docSnap = await getDoc(documentRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  }

  async addDocument(collectionPath: string, data: any): Promise<string> {
    const collectionRef = collection(this.firestore, collectionPath);
    const docRef = await addDoc(collectionRef, data);
    return docRef.id;
  }

  async getCollection(collectionPath: string): Promise<any[]> {
    const collectionRef = collection(this.firestore, collectionPath);
    const snapshot = await getDocs(collectionRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Record<string, any>) }));
  }

  async updateDocument(collectionPath: string, docId: string, data: any): Promise<void> {
    const documentRef = doc(this.firestore, `${collectionPath}/${docId}`);
    await updateDoc(documentRef, data);
  }
}