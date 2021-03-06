import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PairSwitch } from './pair-switch';

describe('PairSwitch', () => {
  let component: PairSwitch;
  let element: HTMLElement;
  let fixture: ComponentFixture<PairSwitch>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [],
      declarations: [PairSwitch],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PairSwitch);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  it('should switch pair and emit an event', () => {
    spyOn(component.changeCoin, 'emit');

    component.coin = 'USDT';
    component.switch();
    expect(component.coin).toEqual('HBTC');
    expect(component.changeCoin.emit).toHaveBeenCalledWith({ coin: 'HBTC' });

    component.coin = 'HBTC';
    component.switch();
    expect(component.coin).toEqual('NEST');
    expect(component.changeCoin.emit).toHaveBeenCalledWith({ coin: 'NEST' });

    component.coin = 'NEST';
    component.switch();
    expect(component.coin).toEqual('USDT');
    expect(component.changeCoin.emit).toHaveBeenCalledWith({ coin: 'USDT' });
  });
});
