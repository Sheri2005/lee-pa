export interface CriterioRegla {
  etiqueta: string;   // "Nivel 3 ofertado"
  cumple?: boolean;   // true = cumple, false = no cumple, undefined = solo informativo
  valor?: string;     // "62 estimados / cupo 35 → 2 paralelos"
}