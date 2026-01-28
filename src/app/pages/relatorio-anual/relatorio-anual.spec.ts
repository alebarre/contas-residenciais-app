import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelatorioAnual } from './relatorio-anual';

describe('RelatorioAnual', () => {
  let component: RelatorioAnual;
  let fixture: ComponentFixture<RelatorioAnual>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelatorioAnual]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RelatorioAnual);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
