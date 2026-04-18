import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-loading',
  templateUrl: './skeleton-loading.component.html',
  styleUrls: ['./skeleton-loading.component.scss'],
  standalone: false,
})
export class SkeletonLoadingComponent {
  @Input() type: 'card' | 'list' | 'balance' = 'list';
  @Input() lines: number = 4;

  get lineArray() { return Array(this.lines); }
}