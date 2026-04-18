import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { StorageService } from './storage.service';

const API_BASE = 'https://sendnotificationfirebase-production.up.railway.app';

@Injectable({ providedIn: 'root' })
export class HttpService {

  constructor(
    private http: HttpClient,
    private secureStorage: StorageService
  ) {}

  async login(): Promise<void> {
    const body = {
      email: 'deiver.vasquezmoreno@unicolombo.edu.co',
      password: '@Deijose1230'
    };

    const res: any = await firstValueFrom(
      this.http.post(`${API_BASE}/user/login`, body)
    );

    const accessToken: string = res?.data?.access_token?.replace('Bearer ', '') ?? '';
    if (accessToken) {
      await this.secureStorage.set('api_token', accessToken);
    }
  }

  async sendNotification(payload: object): Promise<any> {
    let token = await this.secureStorage.get('api_token');

    if (!token) {
      await this.login();
      token = await this.secureStorage.get('api_token');
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return firstValueFrom(
      this.http.post(`${API_BASE}/notifications/`, payload, { headers })
    );
  }
}