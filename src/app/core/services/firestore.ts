import { Injectable } from '@angular/core';
import { Firestore, doc, setDoc, getDoc, collection, addDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  constructor(private firestore: Firestore) { }

  async createDocument(collectionPath: string, docId: string, data: any): Promise<void> {
    const documentRef = doc(this.firestore, `${collectionPath}/${docId}`);
    await setDoc(documentRef, data);
  }

  async getDocument(collectionPath: string, docId: string): Promise<any> {
    const documentRef = doc(this.firestore, `${collectionPath}/${docId}`);
    const docSnap = await getDoc(documentRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null;
    }
  }

  async addDocument(collectionPath: string, data: any): Promise<string> {
    const collectionRef = collection(this.firestore, collectionPath);
    const docRef = await addDoc(collectionRef, data);
    return docRef.id;
  }
}