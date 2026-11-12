import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import {
  consultarBandejaMantenimiento,
  consultarDetalleSolicitudAutorizado,
  consultarHistorialAutorizado,
  consultarIndicadoresAutorizado,
  consultarMisSolicitudes,
} from "../lib/mantenimiento/consultas";
import {
  configurarFalloProveedorCorreo,
  limpiarNotificacionesEmitidas,
  obtenerNotificacionesEmitidas,
} from "../lib/mantenimiento/notificaciones";
import {
  configurarFalloHistorialTransaccional,
  reiniciarRepositorio,
  repositorio,
} from "../lib/mantenimiento/persistencia";
import {
  registrarSolicitud,
  transicionarEstadoSolicitud,
} from "../lib/mantenimiento/solicitudes";
import { DominioError } from "../lib/mantenimiento/types";

describe("Batería de Pruebas del Sistema de Solicitudes de Mantenimiento (Fase 5)", () => {
  beforeEach(() => {
    reiniciarRepositorio();
    limpiarNotificacionesEmitidas();
    configurarFalloProveedorCorreo(false);
    configurarFalloHistorialTransaccional(false);
  });

  describe("6.1 Diez pruebas funcionales obligatorias (CP01 a CP10)", () => {
    it("CP01 (RF01): Empleado autenticado registra solicitud con datos válidos -> crea ID único y estado REGISTRADA", () => {
      const empleadoA = repositorio.obtenerUsuarioPorId("emp-a");
      const conteoPrevio = repositorio.obtenerSolicitudes().length;

      const nueva = registrarSolicitud({
        usuario: empleadoA,
        titulo: "Falla en luminaria de sala de juntas",
        descripcion: "El panel LED central parpadea constantemente.",
        ubicacion: "Edificio A - Sala de Juntas Piso 2",
        prioridad: "MEDIA",
      });

      assert.equal(nueva.id, `SOL-${conteoPrevio + 101}`);
      assert.equal(nueva.estado, "REGISTRADA");
      assert.equal(nueva.creadorId, "emp-a");
      assert.equal(nueva.cerradaEn, null);

      const eventos = repositorio.obtenerEventosPorSolicitud(nueva.id);
      assert.equal(eventos.length, 1);
      assert.equal(eventos[0].estadoNuevo, "REGISTRADA");
      assert.equal(eventos[0].autorId, "emp-a");
    });

    it("CP02 (RF01): Empleado autenticado omite descripción al registrar -> no se crea solicitud y devuelve error 422", () => {
      const empleadoA = repositorio.obtenerUsuarioPorId("emp-a");
      const conteoPrevio = repositorio.obtenerSolicitudes().length;

      assert.throws(
        () =>
          registrarSolicitud({
            usuario: empleadoA,
            titulo: "Reporte incompleto",
            descripcion: "   ",
            ubicacion: "Oficina 101",
          }),
        (err: unknown) => {
          assert(err instanceof DominioError);
          assert.equal(err.status, 422);
          assert.equal(err.codigo, "VALIDACION_FALLIDA");
          return true;
        },
      );

      assert.equal(repositorio.obtenerSolicitudes().length, conteoPrevio);
    });

    it("CP03 (RF02): Empleado consulta Mis solicitudes -> lista únicamente sus propios registros y estados", () => {
      const empleadoA = repositorio.obtenerUsuarioPorId("emp-a");
      const mias = consultarMisSolicitudes(empleadoA);

      assert(mias.length >= 2);
      for (const sol of mias) {
        assert.equal(sol.creadorId, "emp-a");
        assert.ok(sol.id);
        assert.ok(sol.estado);
      }
    });

    it("CP04 (RF02): Empleado A intenta abrir detalle perteneciente a Empleado B -> el servidor rechaza con 403 sin exponer detalles", () => {
      const empleadoA = repositorio.obtenerUsuarioPorId("emp-a");
      // SOL-103 pertenece a emp-b
      assert.throws(
        () => consultarDetalleSolicitudAutorizado(empleadoA, "SOL-103"),
        (err: unknown) => {
          assert(err instanceof DominioError);
          assert.equal(err.status, 403);
          assert.equal(err.codigo, "NO_AUTORIZADO");
          return true;
        },
      );
    });

    it("CP05 (RF03): Técnico autenticado abre bandeja -> muestra todas las solicitudes con ID, fecha, ubicación y estado", () => {
      const tecnico = repositorio.obtenerUsuarioPorId("tec-1");
      const bandeja = consultarBandejaMantenimiento(tecnico, "TODAS");

      assert.equal(bandeja.length, 7);
      for (const item of bandeja) {
        assert.ok(item.id);
        assert.ok(item.creadaEn);
        assert.ok(item.ubicacion);
        assert.ok(item.estado);
      }
    });

    it("CP06 (RF03): Técnico filtra bandeja por estado REGISTRADA -> la lista solo muestra resultados de ese estado", () => {
      const tecnico = repositorio.obtenerUsuarioPorId("tec-1");
      const registradas = consultarBandejaMantenimiento(tecnico, "REGISTRADA");

      assert(registradas.length >= 1);
      for (const item of registradas) {
        assert.equal(item.estado, "REGISTRADA");
      }
    });

    it("CP07 (RF04): Solicitud en REGISTRADA; técnico inicia atención -> estado EN_PROCESO y evento creados juntos", () => {
      const tecnico = repositorio.obtenerUsuarioPorId("tec-1");
      const eventosAntes =
        repositorio.obtenerEventosPorSolicitud("SOL-101").length;

      const actualizada = transicionarEstadoSolicitud({
        usuario: tecnico,
        solicitudId: "SOL-101",
        nuevoEstado: "EN_PROCESO",
        nota: "Se inicia revisión de tubería principal y cierre de llave de paso.",
      });

      assert.equal(actualizada.estado, "EN_PROCESO");
      const eventosDespues = repositorio.obtenerEventosPorSolicitud("SOL-101");
      assert.equal(eventosDespues.length, eventosAntes + 1);
      const ultimoEvento = eventosDespues[eventosDespues.length - 1];
      assert.equal(ultimoEvento.estadoPrevio, "REGISTRADA");
      assert.equal(ultimoEvento.estadoNuevo, "EN_PROCESO");
      assert.equal(ultimoEvento.autorId, "tec-1");
    });

    it("CP08 (RF04): Solicitud en EN_PROCESO; técnico intenta cerrar sin nota (rechaza) y luego con nota (cierra y registra evento)", () => {
      const tecnico = repositorio.obtenerUsuarioPorId("tec-1");

      // 1. Intento de cierre sin nota técnica -> Rechazado (RN-03)
      assert.throws(
        () =>
          transicionarEstadoSolicitud({
            usuario: tecnico,
            solicitudId: "SOL-102",
            nuevoEstado: "CERRADA",
            nota: "   ",
          }),
        (err: unknown) => {
          assert(err instanceof DominioError);
          assert.equal(err.status, 422);
          assert.equal(err.codigo, "VALIDACION_FALLIDA");
          return true;
        },
      );

      // Verificar que sigue EN_PROCESO tras el rechazo
      assert.equal(
        repositorio.obtenerSolicitudPorId("SOL-102")?.estado,
        "EN_PROCESO",
      );

      // 2. Cierre con nota válida -> Aprobado
      const cerrada = transicionarEstadoSolicitud({
        usuario: tecnico,
        solicitudId: "SOL-102",
        nuevoEstado: "CERRADA",
        nota: "Recarga de gas refrigerante R-410A y limpieza de serpentín completada. Temperatura estabilizada en 21°C.",
      });

      assert.equal(cerrada.estado, "CERRADA");
      assert.ok(cerrada.cerradaEn);

      // RN-04: No se permite modificar una solicitud ya CERRADA
      assert.throws(
        () =>
          transicionarEstadoSolicitud({
            usuario: tecnico,
            solicitudId: "SOL-102",
            nuevoEstado: "EN_PROCESO",
            nota: "Intento de reapertura no permitida en MVP",
          }),
        (err: unknown) => {
          assert(err instanceof DominioError);
          assert.equal(err.codigo, "TRANSICION_INVALIDA");
          return true;
        },
      );
    });

    it("CP09 (RF05): Solicitud con dos transiciones (SOL-104) -> historial muestra autor, fecha y cambios en orden cronológico", () => {
      const tecnico = repositorio.obtenerUsuarioPorId("tec-1");
      const historial = consultarHistorialAutorizado(tecnico, "SOL-104");

      assert.equal(historial.length, 3);
      assert.equal(historial[0].estadoNuevo, "REGISTRADA");
      assert.equal(historial[1].estadoNuevo, "EN_PROCESO");
      assert.equal(historial[2].estadoNuevo, "CERRADA");

      for (let i = 1; i < historial.length; i++) {
        const tPrev = new Date(historial[i - 1].fecha).getTime();
        const tCurr = new Date(historial[i].fecha).getTime();
        assert(
          tCurr >= tPrev,
          "Los eventos deben estar en orden cronológico ascendente",
        );
        assert.ok(historial[i].autor.nombre);
      }
    });

    it("CP10 (RF05): Jefatura autenticada abre I08 -> obtiene datos agregados correctos y no tiene permisos de edición", () => {
      const jefatura = repositorio.obtenerUsuarioPorId("jef-1");
      const indicadores = consultarIndicadoresAutorizado(jefatura);

      assert.equal(indicadores.totales, 7);
      assert.equal(indicadores.porEstado.REGISTRADA, 1);
      assert.equal(indicadores.porEstado.EN_PROCESO, 2);
      assert.equal(indicadores.porEstado.CERRADA, 4);
      assert.equal(indicadores.abiertas, 3);
      assert(indicadores.tiempoMedioHoras > 0);
      assert.equal(indicadores.esSimulado, true);
      assert.equal(indicadores.metasAcademicas.tiempoMedio.metaHoras, 48);

      // Jefatura no puede editar estados (Tabla 13 / RN-07)
      assert.throws(
        () =>
          transicionarEstadoSolicitud({
            usuario: jefatura,
            solicitudId: "SOL-101",
            nuevoEstado: "EN_PROCESO",
            nota: "Intento de edición por jefatura",
          }),
        (err: unknown) => {
          assert(err instanceof DominioError);
          assert.equal(err.status, 403);
          return true;
        },
      );
    });
  });

  describe("6.2 Pruebas complementarias de calidad, seguridad y riesgos (CS01–CS03, CI01, ADR-003)", () => {
    it("CS01 (RNF02): Invocar operación protegida sin sesión -> rechazo 401 sin modificar datos", () => {
      const conteoPrevio = repositorio.obtenerSolicitudes().length;

      assert.throws(
        () =>
          registrarSolicitud({
            usuario: null,
            titulo: "Intento sin sesión",
            descripcion: "No debería guardarse",
            ubicacion: "Planta 1",
          }),
        (err: unknown) => {
          assert(err instanceof DominioError);
          assert.equal(err.status, 401);
          assert.equal(err.codigo, "NO_AUTENTICADO");
          return true;
        },
      );

      assert.equal(repositorio.obtenerSolicitudes().length, conteoPrevio);
    });

    it("CS02 (RNF02): EMPLEADO intenta cerrar o cambiar estado de una solicitud -> rechazo 403 desde servidor", () => {
      const empleadoA = repositorio.obtenerUsuarioPorId("emp-a");

      assert.throws(
        () =>
          transicionarEstadoSolicitud({
            usuario: empleadoA,
            solicitudId: "SOL-102",
            nuevoEstado: "CERRADA",
            nota: "Cerrada por empleado sin autorización",
          }),
        (err: unknown) => {
          assert(err instanceof DominioError);
          assert.equal(err.status, 403);
          assert.equal(err.codigo, "NO_AUTORIZADO");
          return true;
        },
      );

      assert.equal(
        repositorio.obtenerSolicitudPorId("SOL-102")?.estado,
        "EN_PROCESO",
      );
    });

    it("CS03 (RNF02): EMPLEADO A intenta acceder a solicitud, historial, bandeja o indicadores restringidos -> rechazo 403", () => {
      const empleadoA = repositorio.obtenerUsuarioPorId("emp-a");

      // Historial de empleado B (SOL-104)
      assert.throws(
        () => consultarHistorialAutorizado(empleadoA, "SOL-104"),
        (err: unknown) => err instanceof DominioError && err.status === 403,
      );

      // Bandeja técnica global
      assert.throws(
        () => consultarBandejaMantenimiento(empleadoA),
        (err: unknown) => err instanceof DominioError && err.status === 403,
      );

      // Indicadores de jefatura
      assert.throws(
        () => consultarIndicadoresAutorizado(empleadoA),
        (err: unknown) => err instanceof DominioError && err.status === 403,
      );
    });

    it("CI01 (RNF03): Provocar fallo al guardar evento de historial -> se revierte también el cambio de estado (rollback atómico)", () => {
      const tecnico = repositorio.obtenerUsuarioPorId("tec-1");
      const eventosPrevios =
        repositorio.obtenerEventosPorSolicitud("SOL-101").length;

      // Activar simulación de fallo en la inserción del evento de historial
      configurarFalloHistorialTransaccional(true);

      assert.throws(
        () =>
          transicionarEstadoSolicitud({
            usuario: tecnico,
            solicitudId: "SOL-101",
            nuevoEstado: "EN_PROCESO",
            nota: "Intento durante fallo de escritura de historial",
          }),
        (err: unknown) => {
          assert(err instanceof DominioError);
          assert.equal(err.status, 500);
          assert.equal(err.codigo, "ERROR_TRANSACCIONAL");
          return true;
        },
      );

      // Verificar que el cambio de estado en SOL-101 se revirtió a REGISTRADA
      const solicitudTrasFallo = repositorio.obtenerSolicitudPorId("SOL-101");
      assert.equal(solicitudTrasFallo?.estado, "REGISTRADA");
      assert.equal(
        repositorio.obtenerEventosPorSolicitud("SOL-101").length,
        eventosPrevios,
      );
    });

    it("ADR-003 (Sección 4.9): Si el servicio futuro de correo falla, el guardado de la solicitud no puede fallar", () => {
      const empleadoA = repositorio.obtenerUsuarioPorId("emp-a");
      configurarFalloProveedorCorreo(true);

      const nueva = registrarSolicitud({
        usuario: empleadoA,
        titulo: "Revisión de válvula de emergencia",
        descripcion: "Goteo leve en válvula de purga.",
        ubicacion: "Cuarto de bombas",
      });

      assert.equal(nueva.estado, "REGISTRADA");
      const notificaciones = obtenerNotificacionesEmitidas();
      assert.equal(notificaciones.length, 1);
      assert.equal(notificaciones[0].estadoEnvio, "FALLO_PROVEEDOR");
    });
  });
});
