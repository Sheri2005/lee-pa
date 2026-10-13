import { Component, input, output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable, of, Subject, throwError } from 'rxjs';
import { routes } from '../../../app.routes';
import { EntidadSiac } from '../../../core/models/registro-sin-siac';
import { GraficoComponent, GraficoSerie } from '../../../shared/components/grafico/grafico';
import { RegistrosSinSiacComponent } from '../../../shared/components/registros-sin-siac/registros-sin-siac.component';
import { ResumenPanel } from '../../../shared/models/panel.model';
import { PanelService } from '../../../shared/services/panel.service';
import { PanelAdministrativoComponent } from './panel-administrativo';

/** Sustitutos de los componentes de G5: el gráfico necesita un canvas real y la lista tiene su propio servicio. */
@Component({ selector: 'app-grafico', template: '' })
class GraficoPrueba {
  readonly tipo = input('');
  readonly titulo = input('');
  readonly etiquetas = input<string[]>([]);
  readonly series = input<GraficoSerie[]>([]);
}

@Component({ selector: 'app-registros-sin-siac', template: '' })
class RegistrosSinSiacPrueba {
  readonly irARegistro = output<{ entidad: EntidadSiac; id: number }>();
}

const RESUMEN: ResumenPanel = {
  carrerasActivas: 6,
  mallasVigentes: 3,
  docentesRegistrados: 7,
  periodosAbiertos: 3,
  registrosSinSiac: 7,
  carrerasPorFacultad: [
    { facultad: 'FCE', carreras: 1 },
    { facultad: 'FI', carreras: 3 },
  ],
};

describe('PanelAdministrativoComponent', () => {
  let fixture: ComponentFixture<PanelAdministrativoComponent>;
  let el: HTMLElement;
  let respuesta: () => Observable<ResumenPanel>;

  async function crear(): Promise<void> {
    TestBed.configureTestingModule({
      imports: [PanelAdministrativoComponent],
      providers: [
        provideRouter([{ path: 'gestion/periodos', children: [] }]),
        { provide: PanelService, useValue: { resumen: () => respuesta() } },
      ],
    }).overrideComponent(PanelAdministrativoComponent, {
      remove: { imports: [GraficoComponent, RegistrosSinSiacComponent] },
      add: { imports: [GraficoPrueba, RegistrosSinSiacPrueba] },
    });
    fixture = TestBed.createComponent(PanelAdministrativoComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  const tarjetas = () => Array.from(el.querySelectorAll('app-tarjeta-indicador'));
  const texto = (n: Element) => n.textContent?.replace(/\s+/g, ' ').trim();
  const tarjeta = (titulo: string) => tarjetas().find((t) => texto(t)?.includes(titulo))!;

  beforeEach(() => (respuesta = () => of(RESUMEN)));

  it('muestra los 5 indicadores de la hoja con su valor', async () => {
    await crear();
    expect(tarjetas().map(texto)).toEqual([
      'Carreras activas 6 En uso C',
      'Mallas vigentes 3 Por carrera M',
      'Docentes registrados 7 En el catálogo D',
      'Períodos abiertos 3 No cerrados P',
      'Sin código SIAC 7 Por completar !',
    ]);
  });

  it('dibuja las carreras activas por facultad en un gráfico de barras', async () => {
    await crear();
    const grafico = fixture.debugElement.query((d) => d.componentInstance instanceof GraficoPrueba)
      .componentInstance as GraficoPrueba;
    expect(grafico.tipo()).toBe('barras');
    expect(grafico.etiquetas()).toEqual(['FCE', 'FI']);
    expect(grafico.series()).toEqual([{ nombre: 'Carreras activas', valores: [1, 3] }]);
  });

  it('incluye la lista de registros sin código SIAC', async () => {
    await crear();
    expect(el.querySelector('#registros-sin-siac app-registros-sin-siac')).not.toBeNull();
  });

  it('avisa mientras carga', async () => {
    const pendiente = new Subject<ResumenPanel>();
    respuesta = () => pendiente;
    await crear();
    expect(el.querySelector('[role="status"]')?.textContent).toContain('Cargando indicadores');
    expect(tarjetas()).toHaveLength(0);
  });

  it('muestra un error con opción de reintentar', async () => {
    let intentos = 0;
    respuesta = () => (++intentos === 1 ? throwError(() => new Error('falló')) : of(RESUMEN));
    await crear();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('No se pudieron cargar los indicadores');

    (el.querySelector('[role="alert"] button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('[role="alert"]')).toBeNull();
    expect(tarjetas()).toHaveLength(5);
  });

  it('la tarjeta lleva a la página del catálogo si ya existe', async () => {
    await crear();
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigateByUrl');

    (tarjeta('Períodos abiertos').querySelector('button') as HTMLButtonElement).click();
    expect(navegar).toHaveBeenCalledWith('/gestion/periodos');
    expect(navegar).toHaveBeenCalledTimes(1);

    navegar.mockClear();
    (tarjeta('Carreras activas').querySelector('button') as HTMLButtonElement).click();
    expect(navegar).not.toHaveBeenCalled(); // /gestion/carreras todavía no existe
  });

  it('desde la lista sin SIAC lleva a la página de la entidad', async () => {
    await crear();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
    const lista = fixture.debugElement.query((d) => d.componentInstance instanceof RegistrosSinSiacPrueba)
      .componentInstance as RegistrosSinSiacPrueba;
    lista.irARegistro.emit({ entidad: 'periodo', id: 2 });
    expect(navegar).toHaveBeenCalledWith('/gestion/periodos');
  });

  describe('ruta', () => {
    it('/gestion/panel muestra el panel', async () => {
      TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl('/gestion/panel');
      expect(harness.routeNativeElement?.querySelector('h1')?.textContent?.trim()).toBe('Panel administrativo');
    });
  });
});
