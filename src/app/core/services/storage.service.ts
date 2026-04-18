import { Injectable } from '@angular/core';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

@Injectable({ providedIn: 'root' })
export class StorageService {

  async set(key: string, value: string): Promise<void> {
    await SecureStoragePlugin.set({ key, value });
  }

  async get(key: string): Promise<string | null> {
    const { value } = await SecureStoragePlugin.get({ key });
    return value;
  }

  async remove(key: string): Promise<void> {
    await SecureStoragePlugin.remove({ key });
  }

  async clear(): Promise<void> {
    await SecureStoragePlugin.clear();
  }
}