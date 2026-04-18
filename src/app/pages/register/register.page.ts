import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { AuthService } from 'src/app/core/services/auth.service';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage implements OnInit {
  registerForm!: FormGroup;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private firestoreService: FirestoreService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.registerForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      tipoDocumento: ['', Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      pais: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onRegister() {
    if (this.registerForm.invalid) {
      await this.toastService.error('Por favor, completa todos los campos correctamente.');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Creando cuenta...' });
    await loading.present();

    const { email, password, ...userData } = this.registerForm.value;

    try {
      const userCredential = await this.authService.register(email, password);

      await this.firestoreService.createDocument('users', userCredential.user.uid, {
        email,
        ...userData,
        balance: 0,
        biometryEnabled: false,
        createdAt: new Date()
      });

      await this.toastService.success('Registro exitoso');
      this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (error: any) {
      await this.toastService.error(error.message || 'Error en el registro');
    } finally {
      loading.dismiss();
    }
  }
}
