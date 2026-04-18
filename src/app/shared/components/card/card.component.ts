import { Component, Input } from '@angular/core';
import { Card } from 'src/app/core/services/card.service';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  standalone: false,
})
export class CardComponent {
  @Input() card!: Card;
}