import { Injectable } from '@angular/core';
import { Dialog } from '@capacitor/dialog';

@Injectable({ providedIn: 'root' })
export class DialogService {

  async confirm(title: string, message: string): Promise<boolean> {
    const { value } = await Dialog.confirm({
      title,
      message,
      okButtonTitle: 'Aceptar',
      cancelButtonTitle: 'Cancelar',
    });
    return value;
  }

  async alert(title: string, message: string): Promise<void> {
    await Dialog.alert({
      title,
      message,
      buttonTitle: 'OK',
    });
  }

  async prompt(title: string, message: string, inputPlaceholder = ''): Promise<string | null> {
    const { value, cancelled } = await Dialog.prompt({
      title,
      message,
      inputPlaceholder,
      inputText: '',
      okButtonTitle: 'Confirmar',
      cancelButtonTitle: 'Cancelar',
    });
    return cancelled ? null : (value || null);
  }
}
