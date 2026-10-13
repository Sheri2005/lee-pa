# app-indicador-carga-docente (C2-15)

Barra de horas asignadas frente a la carga máxima del docente, con porcentaje,
horas disponibles y alerta de sobrecarga.

- **Grupo dueño:** G2 · Planificación (responsable: Xavier Cardenas)
- **Reutilizan:** G2 (`app-sugerencia-docente`), G3 (`app-vista-horario`) y G5 (`app-reporte-carga-docente`)
- **HU:** G2-11

Si necesitan un cambio, abran un issue para el Grupo 2. No copien el componente.
Se mantiene en `src/app/shared/components/indicador-carga-docente`,
siguiendo la estructura de `tarjeta-paralelo` del repositorio.

## Diseño

- Componente standalone con entradas signal, valores derivados con `computed` y `OnPush`.
- Solo Tailwind, sin CSS propio ni dependencias adicionales.
- Clases estándar de Tailwind (`slate`, `emerald`, `amber`, `red`) en lugar de los tokens
  de `src/styles.css` que usa `tarjeta-paralelo`.
- Se adapta al ancho del contenedor y permite que los textos bajen de línea.
- Incluye etiqueta accesible, valor ARIA acotado y descripción de la sobrecarga real.
- La animación respeta la preferencia de movimiento reducido.

## Contrato

| Tipo    | Nombre      | Tipo de dato         | Descripción                                         |
| ------- | ----------- | -------------------- | --------------------------------------------------- |
| Entrada | `asignadas` | `number` obligatorio | Horas asignadas, finitas y mayores o iguales a cero |
| Entrada | `maxima`    | `number` obligatorio | Carga máxima, finita y mayor que cero               |

No emite eventos ni consulta servicios. El padre obtiene o calcula ambos valores;
deben representar horas de la misma unidad y del mismo período.
Mientras los datos se cargan, el padre debe esperar antes de mostrar el indicador,
sin sustituir información faltante por cero.

## Estados

| Situación                                                      | Presentación                            |
| -------------------------------------------------------------- | --------------------------------------- |
| Asignadas menores al máximo                                    | Verde, porcentaje y horas disponibles   |
| Asignadas iguales al máximo                                    | Ámbar, «Carga máxima alcanzada»         |
| Asignadas mayores al máximo                                    | Rojo, porcentaje real y horas de exceso |
| Máxima cero/negativa, asignadas negativas o valores no finitos | Mensaje de datos inválidos, sin barra   |

El tratamiento de máxima cero como dato inválido es una decisión de esta
implementación; el catálogo no especifica ese caso. También se rechaza un cociente
que no pueda representarse como un porcentaje finito.
La barra se limita al 100 %, pero 30 / 24 h muestra 125 % y 6 h de sobrecarga.
Los números se presentan en español con hasta dos decimales; la comparación de
sobrecarga usa los valores originales, sin redondearlos.

## Uso

Ejemplo desde un padre en `src/app/shared/components/sugerencia-docente/`:

```typescript
import { IndicadorCargaDocenteComponent } from '../indicador-carga-docente/indicador-carga-docente.component';
```

Agregar `IndicadorCargaDocenteComponent` al arreglo `imports` del decorador del padre,
conservando sus otros imports. En su plantilla:

```html
<app-indicador-carga-docente [asignadas]="horasAsignadas" [maxima]="cargaMaxima" />
```

`horasAsignadas` y `cargaMaxima` son propiedades numéricas del padre, no nombres
de campos impuestos a la API. Otros módulos importan la misma clase ajustando
la ruta relativa; no necesitan servicios, providers ni rutas nuevas.

## Demostración manual

Para probarlo temporalmente desde `src/app/app.ts`, importar:

```typescript
import { IndicadorCargaDocenteComponent } from './shared/components/indicador-carga-docente/indicador-carga-docente.component';
```

Agregarlo a `imports` de `App` y colocar estos ejemplos en `src/app/app.html`,
conservando el contenido que ya exista:

```html
<div class="mx-auto max-w-xl space-y-4 p-4">
  <app-indicador-carga-docente [asignadas]="0" [maxima]="24" />
  <app-indicador-carga-docente [asignadas]="18" [maxima]="24" />
  <app-indicador-carga-docente [asignadas]="24" [maxima]="24" />
  <app-indicador-carga-docente [asignadas]="30" [maxima]="24" />
  <app-indicador-carga-docente [asignadas]="7.5" [maxima]="15" />
  <app-indicador-carga-docente [asignadas]="6" [maxima]="0" />
</div>
```

Ejecutar `npm start`. La demostración es opcional y no forma parte del layout global.

## Validación

Desde la raíz del repositorio:

```shell
npm ci
npm run build
npm test -- --watch=false
```

Las pruebas verifican carga vacía, normal, decimal, límite exacto, sobrecarga,
descripción accesible, entradas inválidas y actualizaciones de ambas entradas.
