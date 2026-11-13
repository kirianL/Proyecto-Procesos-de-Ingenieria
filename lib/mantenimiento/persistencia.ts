import {
  type AdjuntoEvidencia,
  DominioError,
  type EventoHistorial,
  type Solicitud,
  type Usuario,
} from "./types";

function crearSvgDataUri(titulo: string, subtitulo: string, acento: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600" viewBox="0 0 960 600" fill="none"><rect width="960" height="600" fill="#171716"/><rect x="36" y="36" width="888" height="528" rx="20" fill="#1F1F1D" stroke="#343430" stroke-width="2"/><path d="M120 430L280 270L410 350L590 190L840 370" stroke="${acento}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/><circle cx="590" cy="190" r="24" fill="${acento}" fill-opacity="0.2" stroke="${acento}" stroke-width="3"/><text x="72" y="102" fill="#E6E5E0" font-family="ui-monospace, monospace" font-size="22" font-weight="600">${titulo}</text><text x="72" y="138" fill="#9E9D95" font-family="ui-sans-serif, sans-serif" font-size="18">${subtitulo}</text><text x="72" y="520" fill="#706F68" font-family="ui-monospace, monospace" font-size="14">REGISTRO VISUAL DE INSPECCION · MANTENIMIENTO INTERNO</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const EVIDENCIA_TUBERIA: AdjuntoEvidencia = {
  id: "ADJ-101-A",
  nombre: "inspeccion-tuberia-lab3.svg",
  url: crearSvgDataUri(
    "SOL-101 · Fuga en línea de suministro",
    "Laboratorio 3 - Ala Norte · Registro inicial de humedad",
    "#EA580C",
  ),
  tipo: "image/svg+xml",
  tamanoBytes: 42800,
  etapa: "REPORTE",
  creadoEn: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
};

const EVIDENCIA_CLIMA_REPORTE: AdjuntoEvidencia = {
  id: "ADJ-102-A",
  nombre: "tablero-temperatura-servidores.svg",
  url: crearSvgDataUri(
    "SOL-102 · Lectura térmica 27.4 °C",
    "Sala de Servidores - Piso 1 · Alerta de climatización",
    "#DC2626",
  ),
  tipo: "image/svg+xml",
  tamanoBytes: 38400,
  etapa: "REPORTE",
  creadoEn: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
};

const EVIDENCIA_CLIMA_TECNICA: AdjuntoEvidencia = {
  id: "ADJ-102-B",
  nombre: "manometro-r410a-revision.svg",
  url: crearSvgDataUri(
    "SOL-102 · Diagnóstico R-410A",
    "Válvula de servicio · Verificación de presión en condensador",
    "#2563EB",
  ),
  tipo: "image/svg+xml",
  tamanoBytes: 51200,
  etapa: "ATENCION",
  creadoEn: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
};

export const USUARIOS_INICIALES: Usuario[] = [
  {
    id: "emp-a",
    nombre: "Carlos Méndez",
    correo: "empleado.a@ejemplo.test",
    rol: "EMPLEADO",
    cargo: "Analista de Calidad",
    departamento: "Control de Calidad",
  },
  {
    id: "emp-b",
    nombre: "Lucía Morales",
    correo: "empleado.b@ejemplo.test",
    rol: "EMPLEADO",
    cargo: "Investigadora Senior",
    departamento: "Investigación y Desarrollo",
  },
  {
    id: "tec-1",
    nombre: "Roberto Silva",
    correo: "tecnico@ejemplo.test",
    rol: "TECNICO",
    cargo: "Técnico Especialista en Mantenimiento",
    departamento: "Infraestructura y Servicios",
  },
  {
    id: "jef-1",
    nombre: "Ing. Beatriz Vargas",
    correo: "jefatura@ejemplo.test",
    rol: "JEFATURA",
    cargo: "Jefa de Operaciones y Mantenimiento",
    departamento: "Dirección de Operaciones",
  },
];

export const SOLICITUDES_INICIALES: Solicitud[] = [
  {
    id: "SOL-101",
    creadorId: "emp-a",
    titulo: "Fuga de agua en tubería de suministro principal",
    descripcion:
      "Se detectó una gotera persistente debajo de la mesa de instrumentos 3. El piso presenta acumulación de agua constante y riesgo de resbalón.",
    ubicacion: "Laboratorio 3 - Ala Norte, Piso 2",
    estado: "REGISTRADA",
    prioridad: "ALTA",
    creadaEn: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    cerradaEn: null,
    adjuntos: [EVIDENCIA_TUBERIA],
  },
  {
    id: "SOL-102",
    creadorId: "emp-a",
    titulo: "Falla de climatización y sobrecalentamiento",
    descripcion:
      "La unidad de aire acondicionado presenta vibración inusual y no enfría. La temperatura del recinto supera los 27°C, afectando equipos de medición.",
    ubicacion: "Sala de Servidores - Piso 1",
    estado: "EN_PROCESO",
    prioridad: "URGENTE",
    creadaEn: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    cerradaEn: null,
    adjuntos: [EVIDENCIA_CLIMA_REPORTE, EVIDENCIA_CLIMA_TECNICA],
  },
  {
    id: "SOL-103",
    creadorId: "emp-b",
    titulo: "Chisporroteo en toma eléctrica de pared",
    descripcion:
      "Al conectar el osciloscopio se percibió un arco eléctrico y olor a quemado. El interruptor del circuito se deshabilitó preventivamente.",
    ubicacion: "Oficina 204 - Módulo Técnico",
    estado: "EN_PROCESO",
    prioridad: "ALTA",
    creadaEn: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    cerradaEn: null,
  },
  {
    id: "SOL-104",
    creadorId: "emp-b",
    titulo: "Reemplazo de balasto y luminarias parpadeantes",
    descripcion:
      "Dos tubos LED del sector central del auditorio parpadean constantemente provocando fatiga visual durante las capacitaciones.",
    ubicacion: "Auditorio Central - Planta Baja",
    estado: "CERRADA",
    prioridad: "MEDIA",
    creadaEn: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    cerradaEn: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "SOL-105",
    creadorId: "emp-a",
    titulo: "Ajuste de sensor de cierre en puerta de acceso biométrico",
    descripcion:
      "El electroimán de la puerta de seguridad queda atascado de forma intermitente requiriendo apertura forzada.",
    ubicacion: "Acceso Principal Edificio B",
    estado: "CERRADA",
    prioridad: "BAJA",
    creadaEn: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    cerradaEn: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: "SOL-106",
    creadorId: "emp-b",
    titulo: "Mantenimiento preventivo de extintores",
    descripcion:
      "Revisión anual de carga, precinto y señalización de los extintores del pasillo central. Dos unidades presentan presión baja.",
    ubicacion: "Pasillo central - Planta Baja",
    estado: "CERRADA",
    prioridad: "BAJA",
    creadaEn: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    cerradaEn: new Date(Date.now() - 1000 * 60 * 60 * 24 * 19).toISOString(),
  },
  {
    id: "SOL-107",
    creadorId: "emp-a",
    titulo: "Reparación de persiana metálica en almacén",
    descripcion:
      "La persiana de acceso al almacén general no sube por completo; el mecanismo de cuerda se trabó y deja una abertura insegura.",
    ubicacion: "Almacén General - Piso 1",
    estado: "CERRADA",
    prioridad: "MEDIA",
    creadaEn: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
    cerradaEn: new Date(Date.now() - 1000 * 60 * 60 * 24 * 43.5).toISOString(),
  },
];

export const HISTORIAL_INICIAL: EventoHistorial[] = [
  {
    id: "EVT-01",
    solicitudId: "SOL-101",
    autorId: "emp-a",
    estadoPrevio: null,
    estadoNuevo: "REGISTRADA",
    nota: "Solicitud registrada en el sistema tras reporte inicial.",
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "EVT-02",
    solicitudId: "SOL-102",
    autorId: "emp-a",
    estadoPrevio: null,
    estadoNuevo: "REGISTRADA",
    nota: "Reporte de emergencia climática registrado.",
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    id: "EVT-03",
    solicitudId: "SOL-102",
    autorId: "tec-1",
    estadoPrevio: "REGISTRADA",
    estadoNuevo: "EN_PROCESO",
    nota: "Inspección técnica iniciada. Se detecta fuga menor de gas refrigerante R-410A.",
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    adjuntos: [EVIDENCIA_CLIMA_TECNICA],
  },
  {
    id: "EVT-04",
    solicitudId: "SOL-103",
    autorId: "emp-b",
    estadoPrevio: null,
    estadoNuevo: "REGISTRADA",
    nota: "Registro de riesgo eléctrico preventivo.",
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  },
  {
    id: "EVT-05",
    solicitudId: "SOL-103",
    autorId: "tec-1",
    estadoPrevio: "REGISTRADA",
    estadoNuevo: "EN_PROCESO",
    nota: "Toma aislada físicamente. Solicitando repuesto de tomacorriente grado industrial.",
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
  },
  {
    id: "EVT-06",
    solicitudId: "SOL-104",
    autorId: "emp-b",
    estadoPrevio: null,
    estadoNuevo: "REGISTRADA",
    nota: "Reporte de luminarias parpadeantes.",
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: "EVT-07",
    solicitudId: "SOL-104",
    autorId: "tec-1",
    estadoPrevio: "REGISTRADA",
    estadoNuevo: "EN_PROCESO",
    nota: "Desmontaje de difusores y verificación de fuente.",
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
  },
  {
    id: "EVT-08",
    solicitudId: "SOL-104",
    autorId: "tec-1",
    estadoPrevio: "EN_PROCESO",
    estadoNuevo: "CERRADA",
    nota: "Se cambiaron dos balastos electrónicos y regletas LED. Pruebas de encendido conformes.",
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "EVT-09",
    solicitudId: "SOL-105",
    autorId: "emp-a",
    estadoPrevio: null,
    estadoNuevo: "REGISTRADA",
    nota: "Reporte de acceso intermitente.",
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
  },
  {
    id: "EVT-10",
    solicitudId: "SOL-105",
    autorId: "tec-1",
    estadoPrevio: "REGISTRADA",
    estadoNuevo: "EN_PROCESO",
    nota: "Calibración de resorte y alineación de contraplaca magnética.",
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
  },
  {
    id: "EVT-11",
    solicitudId: "SOL-105",
    autorId: "tec-1",
    estadoPrevio: "EN_PROCESO",
    estadoNuevo: "CERRADA",
    nota: "Cierre ajustado y sincronizado con control de accesos. Funcionamiento regular verificado.",
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: "EVT-12",
    solicitudId: "SOL-106",
    autorId: "emp-b",
    estadoPrevio: null,
    estadoNuevo: "REGISTRADA",
    nota: "Solicitud de revisión anual de extintores.",
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
  },
  {
    id: "EVT-13",
    solicitudId: "SOL-106",
    autorId: "tec-1",
    estadoPrevio: "REGISTRADA",
    estadoNuevo: "EN_PROCESO",
    nota: "Inventario y pesaje de unidades. Se apartan dos extintores con presión baja.",
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 24 * 19.5).toISOString(),
  },
  {
    id: "EVT-14",
    solicitudId: "SOL-106",
    autorId: "tec-1",
    estadoPrevio: "REGISTRADA",
    estadoNuevo: "CERRADA",
    nota: "Recarga de dos unidades, cambio de precintos y rotulación actualizada.",
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 24 * 19).toISOString(),
  },
  {
    id: "EVT-15",
    solicitudId: "SOL-107",
    autorId: "emp-a",
    estadoPrevio: null,
    estadoNuevo: "REGISTRADA",
    nota: "Reporte de persiana trabada en el almacén general.",
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
  },
  {
    id: "EVT-16",
    solicitudId: "SOL-107",
    autorId: "tec-1",
    estadoPrevio: "REGISTRADA",
    estadoNuevo: "EN_PROCESO",
    nota: "Desmontaje del mecanismo y revisión del eje de enrollamiento.",
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 24 * 44).toISOString(),
  },
  {
    id: "EVT-17",
    solicitudId: "SOL-107",
    autorId: "tec-1",
    estadoPrevio: "EN_PROCESO",
    estadoNuevo: "CERRADA",
    nota: "Sustitución de cuerda y ajuste de guías. Apertura y cierre verificados.",
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 24 * 43.5).toISOString(),
  },
];

interface EstadoRepositorio {
  solicitudes: Solicitud[];
  historial: EventoHistorial[];
  usuarioActualId: string;
  simularFalloHistorial: boolean;
}

const clonarAdjuntos = (lista?: AdjuntoEvidencia[]) =>
  lista ? lista.map((item) => ({ ...item })) : undefined;

const clonarSolicitudes = (lista: Solicitud[]): Solicitud[] =>
  lista.map((item) => ({
    ...item,
    ...(item.adjuntos ? { adjuntos: clonarAdjuntos(item.adjuntos) } : {}),
  }));

const clonarHistorial = (lista: EventoHistorial[]): EventoHistorial[] =>
  lista.map((item) => ({
    ...item,
    ...(item.adjuntos ? { adjuntos: clonarAdjuntos(item.adjuntos) } : {}),
  }));

const globalStore = globalThis as unknown as {
  __mantenimientoRepo?: EstadoRepositorio;
};

function obtenerEstadoInterno(): EstadoRepositorio {
  if (!globalStore.__mantenimientoRepo) {
    globalStore.__mantenimientoRepo = {
      solicitudes: clonarSolicitudes(SOLICITUDES_INICIALES),
      historial: clonarHistorial(HISTORIAL_INICIAL),
      usuarioActualId: "emp-a",
      simularFalloHistorial: false,
    };
  }
  return globalStore.__mantenimientoRepo;
}

export interface ContextoTransaccional {
  insertarSolicitud(solicitud: Solicitud): void;
  actualizarSolicitud(solicitud: Solicitud): void;
  insertarEventoHistorial(evento: EventoHistorial): void;
  contarSolicitudes(): number;
}

/**
 * RNF03 / ADR-002 / CI01: Ejecuta múltiples operaciones de persistencia dentro de una
 * unidad transaccional atómica. Si ocurre cualquier fallo al actualizar la solicitud o
 * al insertar su evento en el historial, se revierte el estado completo previo a la transacción.
 */
export function ejecutarTransaccion<T>(
  operacion: (tx: ContextoTransaccional) => T,
): T {
  const repo = obtenerEstadoInterno();
  const respaldoSolicitudes = clonarSolicitudes(repo.solicitudes);
  const respaldoHistorial = clonarHistorial(repo.historial);

  const tx: ContextoTransaccional = {
    insertarSolicitud(solicitud: Solicitud) {
      repo.solicitudes = [{ ...solicitud }, ...repo.solicitudes];
    },
    actualizarSolicitud(solicitudActualizada: Solicitud) {
      const idx = repo.solicitudes.findIndex(
        (s) => s.id === solicitudActualizada.id,
      );
      if (idx === -1) {
        throw new DominioError(
          `Solicitud ${solicitudActualizada.id} no encontrada durante la transacción.`,
          "NO_ENCONTRADO",
          404,
        );
      }
      repo.solicitudes[idx] = { ...solicitudActualizada };
    },
    insertarEventoHistorial(evento: EventoHistorial) {
      if (repo.simularFalloHistorial) {
        throw new DominioError(
          "Fallo transaccional al escribir el evento de historial. Operación revertida íntegramente.",
          "ERROR_TRANSACCIONAL",
          500,
        );
      }
      repo.historial = [...repo.historial, { ...evento }];
    },
    contarSolicitudes() {
      return repo.solicitudes.length;
    },
  };

  try {
    return operacion(tx);
  } catch (error) {
    // Rollback atómico: restaura solicitudes e historial a su estado exacto previo
    repo.solicitudes = respaldoSolicitudes;
    repo.historial = respaldoHistorial;
    throw error;
  }
}

/**
 * CI01: Permite provocar un fallo controlado en la escritura de historial
 * para demostrar y verificar la reversión atómica (rollback) exigida en RNF03.
 */
export function configurarFalloHistorialTransaccional(fallar: boolean): void {
  obtenerEstadoInterno().simularFalloHistorial = fallar;
}

export function reiniciarRepositorio(): void {
  globalStore.__mantenimientoRepo = {
    solicitudes: clonarSolicitudes(SOLICITUDES_INICIALES),
    historial: clonarHistorial(HISTORIAL_INICIAL),
    usuarioActualId: "emp-a",
    simularFalloHistorial: false,
  };
}

export const repositorio = {
  obtenerUsuarios(): Usuario[] {
    return USUARIOS_INICIALES;
  },
  obtenerUsuarioPorId(id: string): Usuario | undefined {
    return USUARIOS_INICIALES.find((u) => u.id === id);
  },
  obtenerUsuarioActualId(): string {
    return obtenerEstadoInterno().usuarioActualId;
  },
  establecerUsuarioActualId(id: string): void {
    obtenerEstadoInterno().usuarioActualId = id;
  },
  obtenerSolicitudes(): Solicitud[] {
    return clonarSolicitudes(obtenerEstadoInterno().solicitudes);
  },
  obtenerSolicitudPorId(id: string): Solicitud | undefined {
    const encontrada = obtenerEstadoInterno().solicitudes.find(
      (s) => s.id === id,
    );
    return encontrada ? { ...encontrada } : undefined;
  },
  obtenerEventosPorSolicitud(solicitudId: string): EventoHistorial[] {
    return clonarHistorial(
      obtenerEstadoInterno().historial.filter(
        (h) => h.solicitudId === solicitudId,
      ),
    );
  },
};
