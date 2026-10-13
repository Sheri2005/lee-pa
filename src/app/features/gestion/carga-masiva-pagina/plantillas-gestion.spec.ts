import { PlantillaCarga } from '../../../shared/models/carga-masiva.model';
import { CargaMasivaService } from '../../../shared/services/carga-masiva.service';
import {
  PLANTILLAS_GESTION,
  PLANTILLA_DOCENTES,
  PLANTILLA_MATERIAS,
  PLANTILLA_MATERIAS_MALLA,
  PLANTILLA_PERIODOS,
  PLANTILLA_USUARIOS,
} from './plantillas-gestion';

describe('Plantillas de carga masiva de Gestión (Anexo C)', () => {
  const servicio = new CargaMasivaService();

  /** Valida una sola fila y devuelve sus errores. */
  const errores = (plantilla: PlantillaCarga, fila: Record<string, string>) =>
    servicio.validar(plantilla, [fila])[0].errores;

  const obligatorias = (p: PlantillaCarga) => p.columnas.filter((c) => c.obligatorio).map((c) => c.clave);
  const todas = (p: PlantillaCarga) => p.columnas.map((c) => c.clave);

  it('hay una plantilla por entidad, en el orden del anexo', () => {
    expect(PLANTILLAS_GESTION.map((p) => p.nombre)).toEqual([
      'Usuarios',
      'Docentes',
      'Períodos',
      'Materias',
      'Materias por malla',
    ]);
  });

  it('las columnas coinciden con el anexo (obligatorias marcadas con *)', () => {
    expect(todas(PLANTILLA_USUARIOS)).toEqual(['username', 'email', 'nombres', 'rol', 'codigo_siac']);
    expect(obligatorias(PLANTILLA_USUARIOS)).toEqual(['username', 'email', 'nombres', 'rol']);

    expect(todas(PLANTILLA_DOCENTES)).toEqual([
      'identificacion', 'nombres', 'email', 'carga_maxima_horas', 'codigo_siac', 'materias_habilitadas',
    ]);
    expect(obligatorias(PLANTILLA_DOCENTES)).toEqual(['identificacion', 'nombres', 'email', 'carga_maxima_horas']);

    expect(todas(PLANTILLA_PERIODOS)).toEqual(['codigo', 'nombre', 'tipo', 'fecha_inicio', 'fecha_fin', 'codigo_siac']);
    expect(obligatorias(PLANTILLA_PERIODOS)).toEqual(['codigo', 'nombre', 'tipo', 'fecha_inicio', 'fecha_fin']);

    expect(todas(PLANTILLA_MATERIAS)).toEqual(['codigo', 'nombre', 'descripcion', 'carrera_responsable', 'codigo_siac']);
    expect(obligatorias(PLANTILLA_MATERIAS)).toEqual(['codigo', 'nombre', 'carrera_responsable']);

    expect(todas(PLANTILLA_MATERIAS_MALLA)).toEqual([
      'malla', 'materia', 'nivel', 'unidad_curricular', 'horas_contacto', 'horas_practico',
      'horas_autonomas', 'prerrequisitos', 'correquisitos',
    ]);
    expect(obligatorias(PLANTILLA_MATERIAS_MALLA)).toEqual([
      'malla', 'materia', 'nivel', 'unidad_curricular', 'horas_contacto', 'horas_practico', 'horas_autonomas',
    ]);
  });

  it('la materia no lleva créditos (son de la malla)', () => {
    expect(todas(PLANTILLA_MATERIAS)).not.toContain('creditos');
  });

  describe('usuarios y docentes', () => {
    const usuario = { username: 'ana', email: 'ana@uees.edu.ec', nombres: 'Ana', rol: 'Docente' };

    it('acepta una fila correcta', () => {
      expect(errores(PLANTILLA_USUARIOS, usuario)).toEqual([]);
    });

    it('rechaza un email inválido', () => {
      expect(errores(PLANTILLA_USUARIOS, { ...usuario, email: 'ana-arroba' })).toEqual([
        'email no es un correo válido.',
      ]);
    });

    it('la carga máxima del docente debe ser mayor que 0', () => {
      const docente = { identificacion: '0912345678', nombres: 'Ana', email: 'ana@uees.edu.ec' };
      expect(errores(PLANTILLA_DOCENTES, { ...docente, carga_maxima_horas: '20.5' })).toEqual([]);
      expect(errores(PLANTILLA_DOCENTES, { ...docente, carga_maxima_horas: '0' })).toHaveLength(1);
      expect(errores(PLANTILLA_DOCENTES, { ...docente, carga_maxima_horas: 'veinte' })).toHaveLength(1);
    });
  });

  describe('períodos', () => {
    const periodo = { codigo: '2027-1', nombre: 'Primer período', tipo: 'ordinario', fecha_inicio: '2027-04-01', fecha_fin: '2027-08-15' };

    it('acepta el tipo sin distinguir mayúsculas', () => {
      expect(errores(PLANTILLA_PERIODOS, periodo)).toEqual([]);
    });

    it('rechaza un tipo que no es ORDINARIO ni EXTRAORDINARIO', () => {
      expect(errores(PLANTILLA_PERIODOS, { ...periodo, tipo: 'regular' })).toEqual([
        'tipo debe ser ORDINARIO, EXTRAORDINARIO.',
      ]);
    });

    it('rechaza fechas con otro formato o que no existen', () => {
      expect(errores(PLANTILLA_PERIODOS, { ...periodo, fecha_inicio: '01/04/2027' })).toContain(
        'fecha_inicio debe tener el formato AAAA-MM-DD.',
      );
      expect(errores(PLANTILLA_PERIODOS, { ...periodo, fecha_inicio: '2027-02-30' })).toContain(
        'fecha_inicio debe tener el formato AAAA-MM-DD.',
      );
    });

    it('fecha_fin debe ser posterior a fecha_inicio', () => {
      expect(errores(PLANTILLA_PERIODOS, { ...periodo, fecha_fin: '2027-04-01' })).toEqual([
        'fecha_fin debe ser posterior a fecha_inicio.',
      ]);
    });
  });

  describe('materias por malla', () => {
    const fila = {
      malla: 'ISW-2024', materia: 'MAT-101', nivel: '1', unidad_curricular: 'basica',
      horas_contacto: '48', horas_practico: '0', horas_autonomas: '72.5',
    };

    it('acepta una fila correcta (horas en 0 y con decimales)', () => {
      expect(errores(PLANTILLA_MATERIAS_MALLA, fila)).toEqual([]);
    });

    it('rechaza nivel 0 o no entero y una unidad desconocida', () => {
      expect(errores(PLANTILLA_MATERIAS_MALLA, { ...fila, nivel: '0' })).toHaveLength(1);
      expect(errores(PLANTILLA_MATERIAS_MALLA, { ...fila, nivel: '1.5' })).toHaveLength(1);
      expect(errores(PLANTILLA_MATERIAS_MALLA, { ...fila, unidad_curricular: 'OPTATIVA' })).toEqual([
        'unidad_curricular debe ser BASICA, PROFESIONAL, INTEGRACION.',
      ]);
    });

    it('rechaza horas que no son números', () => {
      expect(errores(PLANTILLA_MATERIAS_MALLA, { ...fila, horas_autonomas: '-3' })).toEqual([
        'horas_autonomas debe ser un número (0 o más).',
      ]);
    });
  });
});
