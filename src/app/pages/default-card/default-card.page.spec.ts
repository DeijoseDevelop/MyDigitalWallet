import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DefaultCardPage } from './default-card.page';

describe('DefaultCardPage', () => {
  let component: DefaultCardPage;
  let fixture: ComponentFixture<DefaultCardPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DefaultCardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
