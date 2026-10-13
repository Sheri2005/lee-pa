# C1-32: Lista de Mallas (`app-mallas-lista`)

## Descripción General
Componente de página para la visualización y administración general de las mallas curriculares vigentes e históricas de la institución.

## Detalles Técnicos
- **Selector**: `app-mallas-lista`
- **Clase**: `MallasListaComponent`
- **Tipo**: Página
- **Grupo Dueño**: G1 · Gestión
- **Responsable**: Matías Sánchez
- **Ruta**: `/gestion/mallas`

## Integración de Servicios
Conectado a `MallaService` a través de `listar()`[cite: 5] para renderizar de manera dinámica todas las mallas registradas.

## Evidencias / Captura
![Integración de Mallas Lista](image_247f58.png)