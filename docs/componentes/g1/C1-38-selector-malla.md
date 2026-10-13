# C1-38: Selector de Malla (`app-selector-malla`)

## Descripción General
Componente selector de dominio reutilizable que permite elegir una malla curricular filtrando por carrera y preseleccionando automáticamente la vigente.

## Detalles Técnicos
- **Selector**: `app-selector-malla`
- **Clase**: `SelectorMallaComponent`
- **Tipo**: Selector de dominio
- **Grupo Dueño**: G1 · Gestión
- **Responsable**: Matías Sánchez
- **Ruta**: `—`

## Integración de Servicios
Conectado a `MallaService.listar()`[cite: 5] para poblar las opciones dinámicamente y emitir eventos de cambio hacia los componentes consumidores (crucial para flujos del Grupo 2).

## Evidencias / Captura
![Selector de Malla y Malla Service](image_2474d5.png)
![Implementación de Malla Service listar](image_247834.png)