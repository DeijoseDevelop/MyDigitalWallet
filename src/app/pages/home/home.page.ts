import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {

  constructor(private authService: AuthService) { }

  async ngOnInit() {
    const user = this.authService.getCurrentUser();
    
    if (user) {
      const token = await user.getIdToken();
      console.log('--- TOKEN PARA POSTMAN ---');
      console.log(token);
      console.log('---------------------------');
    } else {
      console.warn('No se encontró un usuario autenticado.');
    }
  }

}
