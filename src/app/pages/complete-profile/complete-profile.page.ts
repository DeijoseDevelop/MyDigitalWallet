import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/core/services/auth.service';
import { FirestoreService } from 'src/app/core/services/firestore.service';

@Component({
  selector: 'app-complete-profile',
  templateUrl: './complete-profile.page.html',
  styleUrls: ['./complete-profile.page.scss'],
  standalone: false
})
export class CompleteProfilePage implements OnInit {

  form!: FormGroup;
  googleName = '';
  googleEmail = '';
  photoURL = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private firestoreService: FirestoreService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    const profile = this.authService.getCurrentUserProfile();

    this.googleEmail = profile?.email ?? '';
    this.photoURL = profile?.photoURL ?? '';

    const nameParts = (profile?.displayName ?? '').split(' ');
    this.googleName = profile?.displayName ?? '';

    this.form = this.fb.group({
      nombre: [nameParts[0] ?? '', Validators.required],
      apellido: [nameParts.slice(1).join(' ') ?? '', Validators.required],
      tipoDocumento: ['', Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      pais: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.showToast('Por favor completa todos los campos.');
      return;
    }

    const profile = this.authService.getCurrentUserProfile();
    if (!profile) return;

    const loading = await this.loadingCtrl.create({ message: 'Guardando perfil...' });
    await loading.present();

    try {
      await this.authService.linkPassword(this.googleEmail, this.form.value.password);

      await this.firestoreService.createDocument('users', profile.uid, {
        email: this.googleEmail,
        nombre: this.form.value.nombre,
        apellido: this.form.value.apellido,
        tipoDocumento: this.form.value.tipoDocumento,
        numeroDocumento: this.form.value.numeroDocumento,
        pais: this.form.value.pais,
        balance: 0,
        biometryEnabled: false,
        photoURL: this.photoURL,
        createdAt: new Date()
      });

      this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (error: any) {
      if (error?.code === 'auth/provider-already-linked') {
        this.router.navigateByUrl('/home', { replaceUrl: true });
      } else {
        this.showToast(error.message || 'Error al guardar el perfil.');
      }
    } finally {
      loading.dismiss();
    }
  }

  async showToast(msg: string) {
    const toast = await this.toastCtrl.create({
      message: msg, duration: 3000, color: 'danger'
    });
    toast.present();
  }
}