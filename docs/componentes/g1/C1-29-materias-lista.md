# C1-29: Lista de Materias (`app-materias-lista`)

## Descripción General
Componente de página standalone encargado de listar, filtrar y gestionar las materias del sistema académico dentro del módulo de gestión de carreras y mallas.

## Detalles Técnicos
- **Selector**: `app-materias-lista`
- **Clase**: `MateriasListaComponent`
- **Tipo**: Página
- **Grupo Dueño**: G1 · Gestión
- **Responsable**: Matías Sánchez
- **Ruta**: `/gestion/materias`

## Integración de Servicios
Consume el servicio institucional `MateriaService` mediante su método `listar()` para obtener el catálogo de materias en tiempo de ejecución.

## Evidencias / Captura
![Materia Form Spec y Lista Test](image_242162.png)