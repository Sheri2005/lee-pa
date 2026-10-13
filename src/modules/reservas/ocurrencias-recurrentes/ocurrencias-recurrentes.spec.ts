import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Ocupacion, Ocurrencia } from '../../../app/core/models/ocupacion.model';
import {
  describirConflicto,
  fechaConDia,
  OcurrenciasRecurrentesComponent,
} from './ocurrencias-recurrentes';

const clase: Ocupacion = {
  tipo: 'CLASE',
  id: 3,
  espacio_id: 7,
  fecha: '2026-11-10',
  hora_inicio: '08:00',
  hora_fin: '10:00',
  titulo: 'Cálculo I · P1',
};

const ocurrencia = (
  fecha: string,
  estado: Ocurrencia['estado'] = 'DISPONIBLE',
  conflictos: Ocurrencia['conflictos'] = [],
): Ocurrencia => ({ fecha, hora_inicio: '09:00', hora_fin: '11:00', estado, conflictos });

/** Martes desde el 3 de noviembre: `n` semanas. */
const martes = (n: number) =>
  Array.from({ length: n }, (_, i) =>
    ocurrencia(new Date(Date.UTC(2026, 10, 3 + i * 7)).toISOString().slice(0, 10)),
  );

describe('OcurrenciasRecurrentesComponent (C4-10)', () => {
  let fixture: ComponentFixture<OcurrenciasRecurrentesComponent>;
  let raiz: HTMLElement;

  const filas = () => [...raiz.querySelectorAll<HTMLLIElement>('ol > li')];
  const boton = (texto: string) =>
    [...raiz.querySelectorAll('button')].find((b) => b.textContent?.includes(texto));
  const mostrar = (ocurrencias: Ocurrencia[]) => {
    fixture.componentRef.setInput('ocurrencias', ocurrencias);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OcurrenciasRecurrentesComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(OcurrenciasRecurrentesComponent);
    raiz = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('sin ocurrencias muestra un estado vacío y ninguna fila', () => {
    expect(filas()).toEqual([]);
    expect(raiz.textContent).toContain('Elige los días');
  });

  it('muestra cada fecha con su horario y su estado en texto', () => {
    mostrar([ocurrencia('2026-11-03'), ocurrencia('2026-11-10', 'PENDIENTE')]);

    expect(filas().length).toBe(2);
    expect(filas()[0].textContent).toContain('Mar 03/11/2026');
    expect(filas()[0].textContent).toContain('09:00–11:00');
    expect(filas()[0].textContent).toContain('Disponible');
    expect(filas()[1].textContent).toContain('Por comprobar');
    expect(raiz.querySelector('[role="status"]')?.textContent).toContain(
      '1 disponible, 1 por comprobar',
    );
  });

  it('si todas están por comprobar lo resume así y no ofrece filtro', () => {
    mostrar([ocurrencia('2026-11-03', 'PENDIENTE'), ocurrencia('2026-11-10', 'PENDIENTE')]);

    expect(raiz.querySelector('[role="status"]')?.textContent).toContain('2 fechas por comprobar');
    expect(boton('Con conflicto')).toBeUndefined();
  });

  it('explica cada conflicto y permite ver solo las fechas con conflicto', () => {
    mostrar([
      ocurrencia('2026-11-03'),
      ocurrencia('2026-11-10', 'CONFLICTO', [{ ocupacion: clase, motivo: 'CRUCE' }]),
      ocurrencia('2026-11-17'),
    ]);

    expect(filas()[1].textContent).toContain('Se cruza con la clase Cálculo I · P1 (08:00–10:00).');
    expect(raiz.querySelector('[role="status"]')?.textContent).toContain(
      '2 disponibles, 1 con conflicto',
    );

    boton('Con conflicto')!.click();
    fixture.detectChanges();

    expect(filas().length).toBe(1);
    expect(boton('Con conflicto')!.getAttribute('aria-pressed')).toBe('true');

    // Si se resuelven los conflictos, vuelve a mostrar todas.
    mostrar([ocurrencia('2026-11-03'), ocurrencia('2026-11-10'), ocurrencia('2026-11-17')]);
    expect(filas().length).toBe(3);
    expect(boton('Con conflicto (0)')!.disabled).toBe(true);
  });

  it('filtra Todas, Disponibles o Con conflicto con su cantidad', () => {
    mostrar([
      ocurrencia('2026-11-03'),
      ocurrencia('2026-11-10', 'CONFLICTO', [{ ocupacion: clase, motivo: 'CRUCE' }]),
      ocurrencia('2026-11-17'),
      ocurrencia('2026-11-24', 'PENDIENTE'),
    ]);

    expect(boton('Todas (4)')!.getAttribute('aria-pressed')).toBe('true');
    expect(boton('Con conflicto (1)')).toBeDefined();

    boton('Disponibles (2)')!.click();
    fixture.detectChanges();
    expect(filas().length).toBe(2);
    expect(filas().every((f) => f.textContent?.includes('Disponible'))).toBe(true);

    boton('Todas (4)')!.click();
    fixture.detectChanges();
    expect(filas().length).toBe(4);
  });

  it('muestra 8 filas y despliega el resto', () => {
    mostrar(martes(13));

    expect(filas().length).toBe(8);
    const ver = boton('Ver las 5 restantes')!;
    expect(ver.getAttribute('aria-expanded')).toBe('false');

    ver.click();
    fixture.detectChanges();

    expect(filas().length).toBe(13);
    expect(boton('Ver menos')!.getAttribute('aria-expanded')).toBe('true');
  });

  it('describe la falta de separación y las reservas', () => {
    expect(fechaConDia('2026-11-14')).toBe('Sáb 14/11/2026');
    expect(describirConflicto({ ocupacion: clase, motivo: 'SEPARACION' })).toBe(
      'Quedan menos de 15 minutos libres con la clase Cálculo I · P1 (08:00–10:00).',
    );
    expect(
      describirConflicto({
        ocupacion: { ...clase, tipo: 'RESERVA', estado: 'APROBADA', titulo: 'Taller de robótica' },
        motivo: 'CRUCE',
      }),
    ).toBe('Se cruza con la reserva aprobada «Taller de robótica» (08:00–10:00).');
  });
});
