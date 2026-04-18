import { NgModule } from '@angular/core';
import { PaymentPageRoutingModule } from './payment-routing.module';
import { PaymentPage } from './payment.page';
import { SharedModule } from 'src/app/shared/shared-module';

@NgModule({
  imports: [SharedModule, PaymentPageRoutingModule],
  declarations: [PaymentPage]
})
export class PaymentPageModule {}