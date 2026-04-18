import { Component, Input, OnInit } from '@angular/core';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-balance-display',
  templateUrl: './balance-display.component.html',
  styleUrls: ['./balance-display.component.scss'],
  standalone: false,
})
export class BalanceDisplayComponent implements OnInit {
  @Input() balance: number = 0;
  visible = true;

  constructor(private userService: UserService) {}

  async ngOnInit() {
    const data = await this.userService.getUserData();
    if (data) this.balance = data.balance;
  }

  toggleVisibility() {
    this.visible = !this.visible;
  }
}