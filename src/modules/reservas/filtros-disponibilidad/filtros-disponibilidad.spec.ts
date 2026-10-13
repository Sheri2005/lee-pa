import { ComponentFixture, TestBed } from '@angular/core/testing';
import { hoy, sumarDias } from '../../../app/shared/components/selector-rango-fechas/rango-fechas';
import { FiltroDisponibilidad, FiltrosDisponibilidadComponent } from './filtros-disponibilidad';

const TIPOS = [
  { valor: 'AULA', etiqueta: 'Aula' },
  { valor: 'LABORATORIO', etiqueta: 'Laboratorio' },
];
const EDIFICIOS = [
  { valor: '1', etiqueta: 'Bloque F' },
  { valor: '2', etiqueta: 'Bloque G' },
];
const RECURSOS = [
  'Proyector',
  'Pizarra digital',
  'Computadoras',
  'Aire acondicionado',
  'Sistema de audio',
  'Equipos de red',
].map((etiqueta, i) => ({ valor: String(i + 1), etiqueta }));

describe('FiltrosDisponibilidadComponent (C4-02)', () => {
  let fixture: ComponentFixture<FiltrosDisponibilidadComponent>;
  let raiz: HTMLElement;
  let busquedas: FiltroDisponibilidad[];

  const campo = <T extends HTMLElement = HTMLInputElement>(nombre: string) =>
    raiz.querySelector<T>(`[name="${nombre}"]`)!;
  const escribir = (nombre: string, valor: string) => {
    const elemento = campo(nombre);
    elemento.value = valor;
    elemento.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const elegir = (nombre: string, valor: string) => {
    campo<HTMLButtonElement>(nombre).click();
    fixture.detectChanges();
    raiz.querySelector<HTMLElement>(`[role="option"][data-valor="${valor}"]`)!.click();
    fixture.detectChanges();
  };
  const abrirRecursos = () => {
    if (!raiz.querySelector('[aria-multiselectable]')) {
      campo<HTMLButtonElement>('recursos').click();
      fixture.detectChanges();
    }
  };
  const recurso = (nombre: string) => {
    abrirRecursos();
    return [...raiz.querySelectorAll<HTMLElement>('[aria-multiselectable] [role="option"]')].find(
      (o) => o.textContent?.trim() === nombre,
    )!;
  };
  const pulsar = (texto: string) => {
    [...raiz.querySelectorAll('button')].find((b) => b.textContent?.trim() === texto)!.click();
    fixture.detectChanges();
  };
  const pulsarPorEtiqueta = (etiqueta: string) => {
    raiz.querySelector<HTMLButtonElement>(`button[aria-label="${etiqueta}"]`)!.click();
    fixture.detectChanges();
  };
  const rango = () => {
    escribir('fecha', '2026-11-16');
    escribir('inicio', '14:00');
    escribir('fin', '15:30');
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FiltrosDisponibilidadComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(FiltrosDisponibilidadComponent);
    fixture.componentRef.setInput('fechaMin', '2026-10-01');
    fixture.componentRef.setInput('tiposEspacio', TIPOS);
    fixture.componentRef.setInput('edificios', EDIFICIOS);
    fixture.componentRef.setInput('recursos', RECURSOS);
    busquedas = [];
    fixture.componentInstance.buscar.subscribe((f) => busquedas.push(f));
    raiz = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('muestra todos los filtros dentro de la barra', () => {
    expect(raiz.querySelector('form[role="search"]')?.textContent).toContain(
      'Buscar espacios disponibles',
    );
    for (const nombre of ['fecha', 'inicio', 'fin', 'tipo', 'edificio', 'capacidad']) {
      expect(campo(nombre)).not.toBeNull();
    }
    abrirRecursos();
    expect(raiz.querySelectorAll('[aria-multiselectable] [role="option"]')).toHaveLength(6);
  });

  it('no busca sin fecha ni horario y lo avisa', () => {
    pulsar('Buscar');

    expect(busquedas).toEqual([]);
    expect(raiz.querySelector('[role="alert"]')?.textContent).toContain(
      'Elige la fecha y el horario',
    );
  });

  it('no busca con un horario inválido', () => {
    escribir('fecha', '2026-11-16');
    escribir('inicio', '15:00');
    escribir('fin', '14:00');
    pulsar('Buscar');

    expect(busquedas).toEqual([]);
    expect(raiz.textContent).toContain('posterior a la hora de inicio');
  });

  it('busca solo con el rango y deja el resto sin filtrar', () => {
    rango();
    pulsar('Buscar');

    expect(busquedas).toEqual([
      {
        fecha: '2026-11-16',
        horaInicio: '14:00',
        horaFin: '15:30',
        tipoEspacio: null,
        capacidadMinima: null,
        recursos: [],
        edificioId: null,
      },
    ]);
  });

  it('emite todos los filtros y cuenta los opcionales activos', () => {
    rango();
    elegir('tipo', 'LABORATORIO');
    elegir('edificio', '2');
    escribir('capacidad', '15');
    recurso('Equipos de red').click();
    recurso('Computadoras').click();
    fixture.detectChanges();

    expect(raiz.textContent).toContain('4 activos');

    pulsar('Buscar');
    expect(busquedas.at(-1)).toEqual({
      fecha: '2026-11-16',
      horaInicio: '14:00',
      horaFin: '15:30',
      tipoEspacio: 'LABORATORIO',
      capacidadMinima: 15,
      recursos: [3, 6],
      edificioId: 2,
    });
  });

  it('rechaza una capacidad mínima no válida', () => {
    rango();
    escribir('capacidad', '0');
    pulsar('Buscar');

    expect(busquedas).toEqual([]);
    expect(raiz.textContent).toContain('número entero mayor que 0');
    expect(campo('capacidad').getAttribute('aria-invalid')).toBe('true');
  });

  it('busca al enviar con Enter', () => {
    rango();
    raiz.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(busquedas).toHaveLength(1);
  });

  it('Limpiar restablece todos los filtros, incluido el rango horario', () => {
    rango();
    elegir('tipo', 'AULA');
    escribir('capacidad', '30');
    recurso('Proyector').click();
    fixture.detectChanges();
    pulsar('Buscar');

    pulsar('Limpiar');

    expect(campo('fecha').value).toBe('');
    expect(campo('inicio').value).toBe('');
    expect(campo('fin').value).toBe('');
    expect(campo('tipo').textContent).toContain('Todos');
    expect(campo('capacidad').value).toBe('');
    expect(campo('recursos').textContent).toContain('Cualquiera');
    expect(raiz.textContent).not.toContain('activo');
    expect(raiz.querySelector('[role="alert"]')).toBeNull();
    expect(busquedas).toHaveLength(1);
  });

  it('por defecto no deja buscar en fechas pasadas', () => {
    const otro = TestBed.createComponent(FiltrosDisponibilidadComponent);
    const emitidos: FiltroDisponibilidad[] = [];
    otro.componentInstance.buscar.subscribe((f) => emitidos.push(f));
    otro.detectChanges();
    const elemento: HTMLElement = otro.nativeElement;
    const poner = (nombre: string, valor: string) => {
      const campo = elemento.querySelector<HTMLInputElement>(`input[name="${nombre}"]`)!;
      campo.value = valor;
      campo.dispatchEvent(new Event('input'));
      otro.detectChanges();
    };

    poner('fecha', sumarDias(hoy(), -1));
    poner('inicio', '09:00');
    poner('fin', '10:00');
    [...elemento.querySelectorAll('button')]
      .find((b) => b.textContent?.trim() === 'Buscar')!
      .click();
    otro.detectChanges();

    expect(emitidos).toEqual([]);
    expect(elemento.textContent).toContain('igual o posterior');
  });

  it('no busca en fin de semana ni con capacidades exageradas', () => {
    escribir('fecha', '2026-11-14');
    escribir('inicio', '09:00');
    escribir('fin', '10:00');
    pulsar('Buscar');
    expect(busquedas).toEqual([]);
    expect(raiz.textContent).toContain('lunes a viernes');

    rango();
    escribir('capacidad', '900');
    pulsar('Buscar');
    expect(busquedas).toEqual([]);
    expect(raiz.textContent).toContain('500 personas');
  });

  it('la capacidad mínima se ajusta a 500 y se maneja con − y +', () => {
    escribir('capacidad', '900');
    campo('capacidad').dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(campo('capacidad').value).toBe('500');

    pulsarPorEtiqueta('Restar 5 asistentes');
    expect(campo('capacidad').value).toBe('495');
  });

  it('busca recursos por nombre en la lista', () => {
    abrirRecursos();
    const buscador = raiz.querySelector<HTMLInputElement>('input[type="search"]')!;
    buscador.value = 'red';
    buscador.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const opciones = raiz.querySelectorAll('[aria-multiselectable] [role="option"]');
    expect(opciones).toHaveLength(1);
    expect(opciones[0].textContent).toContain('Equipos de red');
  });
});
