# SPARE Frontend

SPARE es el Sistema de Planificación Académica y Reservas de Espacios.

## Tecnologías

- Angular
- Tailwind CSS (uso obligatorio para los estilos)

## Grupos y módulos

El código de cada módulo se organiza en su carpeta dentro de `src/modules/`.

| Grupo | Módulo | Responsabilidad | Integrantes | Rama |
| --- | --- | --- | --- | --- |
| 1 | Gestión | Usuarios, carreras, mallas y configuración académica base | Hidalgo, Claros, Rivas, Sánchez | `grupo-1-gestion` |
| 2 | Planificación | Planificación académica y sugerencia de cursos por reglas | Viteri, Martillo, Garay, Cárdenas | `grupo-2-planificacion` |
| 3 | Horarios | Horarios y asignación de aulas y laboratorios por reglas | Pastor, Mejía, León, Martínez | `grupo-3-horarios` |
| 4 | Reservas | Reservas de espacios y recursos | Karel González, Soledispa, Sotomayor, Molina | `grupo-4-reservas` |
| 5 | Reportería | Aprobaciones, notificaciones, reportería y exportación al SIAC 1.0 | Lima, Calderón, Rea, Guamán | `grupo-5-reporteria` |

Cada grupo desarrolla su módulo en la rama asignada. Los cambios se integran en `main` mediante Pull Request.


## Documentación de Componentes

| ID | Componente (selector) | Clase Angular | Tipo | Grupo dueño | Responsable | Ruta (si es página) | Documentación |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **C1-01** | `app-shell-layout` | `ShellLayout` | Layout | G1 · Gestión | Maximilian Rivas | `/` | [Ver Doc](docs/componentes/g1/C1-01-shell-layout.md) |
| **C1-02** | `app-menu-lateral` | `MenuLateralComponent` | Hijo | G1 · Gestión | Jose Luis Hidalgo | `—` | [Ver Doc](docs/componentes/g1/C1-02-menu-lateral.md) |
| **C1-03** | `app-barra-superior` | `BarraSuperiorComponent` | Hijo | G1 · Gestión | Maximilian Rivas | `—` | [Ver Doc](docs/componentes/g1/C1-03-barra-superior.md) |
| **C1-04** | `app-menu-usuario` | `MenuUsuarioComponent` | Hijo | G1 · Gestión | Maximilian Rivas | `—` | [Ver Doc](docs/componentes/g1/C1-04-menu-usuario.md) |
| **C1-07** | `app-acceso-denegado` | `AccesoDenegadoComponent` | Página | G1 · Gestión | Jose Luis Hidalgo | `/acceso-denegado` | [Ver Doc](docs/componentes/g1/C1-07-app-acceso-denegado.md) |
| **C1-13** | `app-selector-rol` | `SelectorRolComponent` | Selector de dominio | G1 · Gestión | Jose Luis Hidalgo | `—` | [Ver Doc](docs/componentes/g1/C1-13-selector-rol.md) |
| **C1-14** | `app-selector-usuario` | `SelectorUsuarioComponent` | Selector de dominio | G1 · Gestión | Jose Luis Hidalgo | `—` | [Ver Doc](docs/componentes/g1/C1-14-selector-usuario.md) |
| **C1-20** | `app-facultades-lista` | `FacultadesListaComponent` | Página | G1 · Gestión | Jose Luis Hidalgo | `/gestion/facultades` | [Ver Doc](docs/componentes/g1/C1-20-facultades-lista.md) |
| **C1-22** | `app-selector-facultad` | `SelectorFacultadComponent` | Selector de dominio | G1 · Gestión | Jose Luis Hidalgo | `—` | [Ver Doc](docs/componentes/g1/C1-22-selector-facultad.md) |
| **C1-25** | `app-selector-carrera` | `SelectorCarreraComponent` | Selector de dominio | G1 · Gestión | Jose Luis Hidalgo | `—` | [Ver Doc](docs/componentes/g1/C1-25-selector-carrera.md) |
| **C1-26** | `app-periodos-lista` | `PeriodosListaComponent` | Página | G1 · Gestión | Julio Claros | `/gestion/periodos` | [Ver Doc](docs/componentes/g1/C1-26-periodos-lista.md) |
| **C1-27** | `app-periodo-form` | `PeriodoFormComponent` | Hijo (formulario) | G1 · Gestión | Julio Claros | `—` | [Ver Doc](docs/componentes/g1/C1-27-periodo-form.md) |
| **C1-28** | `app-selector-periodo` | `SelectorPeriodoComponent` | Selector de dominio | G1 · Gestión | Julio Claros | `—` | [Ver Doc](docs/componentes/g1/C1-28-selector-periodo.md) |
| **C1-31** | `app-selector-materia` | `SelectorMateriaComponent` | Selector de dominio | G1 · Gestión | Julio Claros | `—` | [Ver Doc](docs/componentes/g1/C1-31-selector-materia.md) |
| **C1-33** | `app-malla-form` | `MallaFormComponent` | Hijo (formulario) | G1 · Gestión | Julio Claros | `—` | [Ver Doc](docs/componentes/g1/C1-33-malla-form.md) |
| **C1-35** | `app-malla-por-niveles` | `MallaPorNivelesComponent` | Hijo | G1 · Gestión | Matias | `—` | [Ver Doc](src/app/components/malla-por-niveles/README.md) |
| **C1-39** | `app-selector-nivel` | `SelectorNivelComponent` | Selector de dominio | G1 · Gestión | Julio Claros | `—` | [Ver Doc](docs/componentes/g1/C1-39-selector-nivel.md) |
| **C1-42** | `app-docente-materias` | `DocenteMateriasComponent` | Hijo | G1 · Gestión | Julio Claros | `—` | [Ver Doc](docs/componentes/g1/C1-42-docente-materias.md) |
| **C1-43** | `app-selector-docente` | `SelectorDocenteComponent` | Selector de dominio | G1 · Gestión | Julio Claros | `—` | [Ver Doc](docs/componentes/g1/C1-43-selector-docente.md) |
| **C1-50** | `app-carga-masiva` | `CargaMasivaComponent` | Contenedor reutilizable | G1 · Gestión | Julio Claros | `—` | [Ver Doc](docs/componentes/g1/C1-50-carga-masiva.md) |
| **C1-51** | `app-descarga-plantilla` | `DescargaPlantillaComponent` | Hijo | G1 · Gestión | Julio Claros | `—` | [Ver Doc](docs/componentes/g1/C1-51-descarga-plantilla.md) |
| **C1-53** | `app-previsualizacion-carga` | `PrevisualizacionCargaComponent` | Hijo | G1 · Gestión | Julio Claros | `—` | [Ver Doc](docs/componentes/g1/C1-53-previsualizacion-carga.md) |
| **C1-54** | `app-resumen-importacion` | `ResumenImportacionComponent` | Hijo | G1 · Gestión | Jose Luis Hidalgo | `—` | [Ver Doc](docs/componentes/g1/C1-54-resumen-importacion.md) |
| **C1-55** | `app-carga-masiva-pagina` | `CargaMasivaPaginaComponent` | Página | G1 · Gestión | Jose Luis Hidalgo | `/gestion/carga-masiva` | [Ver Doc](docs/componentes/g1/C1-55-carga-masiva-pagina.md) |
| **C1-56** | `app-bitacora-importaciones` | `BitacoraImportacionesComponent` | Página | G1 · Gestión | Jose Luis Hidalgo | `/gestion/carga-masiva/bitacora` | [Ver Doc](docs/componentes/g1/C1-56-bitacora-importaciones.md) |
| **C1-60** | `app-panel-administrativo` | `PanelAdministrativoComponent` | Página | G1 · Gestión | Jose Luis Hidalgo | `/gestion/panel` | [Ver Doc](docs/componentes/g1/C1-60-panel-administrativo.md) |