# C4-01 · Buscar espacios

Página `/reservas/buscar` que coordina la búsqueda de espacios libres. Reutiliza los contratos reales de `app-filtros-disponibilidad` (C4-02) y `app-resultados-disponibilidad` (C4-03), consulta `DisponibilidadEspacioService` y abre el futuro flujo `/reservas/nueva` con el espacio y la franja elegidos.

## Contrato y flujo

1. C4-02 emite `FiltroDisponibilidad` mediante `(buscar)`.
2. La página cancela cualquier consulta anterior y llama `DisponibilidadEspacioService.buscar(filtros)`.
3. C4-03 recibe los espacios y el estado de carga.
4. Al pulsar **Reservar**, la página navega a `/reservas/nueva` con `espacioId`, `fecha`, `horaInicio` y `horaFin` como parámetros.

El servicio devuelve por ahora una lista vacía porque el endpoint del backend aún no existe; su contrato queda aislado para conectarlo sin cambiar la página.

## Dependencia de G3

El catálogo requiere `app-encabezado-pagina` (C3-23). Ese componente todavía no forma parte de `grupo-4-reservas`, por lo que esta página usa temporalmente una cabecera semántica local, marcada en la plantilla. No se creó una copia con el selector de G3. Cuando se integre la dependencia, solo debe sustituirse ese bloque de cabecera.

## Ruta

Siguiendo la guía del grupo, la entrega no modifica `app.routes.ts`. Para registrarla:

```ts
{
  path: 'reservas/buscar',
  loadComponent: () =>
    import('../modules/reservas/buscar-espacios/buscar-espacios').then(
      (m) => m.BuscarEspaciosComponent,
    ),
}
```

`app-root` debe tener `<router-outlet />` (lo aportará el layout de G1, `app-shell-layout`).

## Verificación

La prueba cubre composición, consulta exitosa, carga, error y navegación hacia la creación de reserva.
