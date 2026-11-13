"use client";

import {
  ArrowRightIcon,
  BuildingsIcon,
  CheckCircleIcon,
  ClockIcon,
  DownloadSimpleIcon,
  EyeIcon,
  FileTextIcon,
  HourglassIcon,
  TargetIcon,
  TrendUpIcon,
  WarningIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AccesoRestringido } from "@/components/mantenimiento/AccesoRestringido";
import { BottomBar } from "@/components/mantenimiento/BottomBar";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { OPCIONES_PRIORIDAD } from "@/components/ui/PriorityPicker";
import {
  SegmentedControl,
  type Segmento,
} from "@/components/ui/SegmentedControl";
import { SkeletonContent } from "@/components/ui/Skeleton";
import { SlotNumber } from "@/components/ui/SlotNumber";
import { cn } from "@/helpers/classname-helper";
import { nombreLimpio } from "@/helpers/iniciales";
import { useAtajos } from "@/hooks/useAtajos";
import { puedeVerIndicadores } from "@/lib/mantenimiento/auth";
import { METAS_ACADEMICAS_ODS12 } from "@/lib/mantenimiento/consultas";
import { calcularEstadoSla } from "@/lib/mantenimiento/sla";
import {
  getBandejaMantenimiento,
  getResumenSatisfaccion,
  getUsuarioActual,
  getUsuarios,
  SOLICITUDES_MUESTRA,
} from "@/lib/mantenimiento/store";
import type { Estado, Solicitud, Usuario } from "@/lib/mantenimiento/types";

const META_HORAS = 48;

type Periodo = "TODO" | "7D" | "30D" | "90D" | "CUSTOM";

const PERIODOS: Segmento<Periodo>[] = [
  { id: "TODO", label: "Histórico" },
  { id: "7D", label: "7 días" },
  { id: "30D", label: "Este mes" },
  { id: "90D", label: "Trimestre" },
];

const DIAS_POR_PERIODO: Record<Exclude<Periodo, "CUSTOM">, number | null> = {
  TODO: null,
  "7D": 7,
  "30D": 30,
  "90D": 90,
};

function formatearIsoLocal(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fechaInputHoy(): string {
  return formatearIsoLocal(new Date());
}

function fechaInputHaceDias(dias: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  return formatearIsoLocal(fecha);
}

function formatearRangoEtiqueta(desde: string, hasta: string): string {
  const parsear = (iso: string) => {
    const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
    return y && m && d ? new Date(y, m - 1, d) : new Date();
  };
  const formatoCorto = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
  });
  const formatoConAnio = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  if (!desde && !hasta) return "el rango seleccionado";
  if (desde === hasta) return `el ${formatoConAnio.format(parsear(desde))}`;
  const d = parsear(desde);
  const h = parsear(hasta);
  if (d.getFullYear() === h.getFullYear()) {
    return `${formatoCorto.format(d)} – ${formatoConAnio.format(h)}`;
  }
  return `${formatoConAnio.format(d)} – ${formatoConAnio.format(h)}`;
}

function escaparCsv(valor: string | number): string {
  const texto = String(valor ?? "");
  return `"${texto.replace(/"/g, '""')}"`;
}

function escaparHtml(valor: string | number): string {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const DOT_ESTADO: Record<Estado, string> = {
  REGISTRADA: "bg-amber-8",
  EN_PROCESO: "bg-blue-8",
  CERRADA: "bg-grayscale-8",
};

export default function IndicadoresPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario>(getUsuarioActual());
  const [solicitudes, setSolicitudes] = useState<Solicitud[] | null>(() => getBandejaMantenimiento());
  const [periodo, setPeriodo] = useState<Periodo>("TODO");
  const [fechaDesde, setFechaDesde] = useState<string>(() =>
    fechaInputHaceDias(30),
  );
  const [fechaHasta, setFechaHasta] = useState<string>(() => fechaInputHoy());
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    const refrescar = () => {
      setUsuario(getUsuarioActual());
      setSolicitudes(getBandejaMantenimiento());
    };
    refrescar();
    setMontado(true);
    window.addEventListener("usuario-cambiado", refrescar);
    return () => window.removeEventListener("usuario-cambiado", refrescar);
  }, []);

  const autorizado = puedeVerIndicadores(usuario);

  useAtajos({ escape: () => router.push("/") }, autorizado);

  if (!autorizado) {
    return (
      <AccesoRestringido
        tituloPantalla="Resumen e indicadores"
        usuario={usuario}
        rolesPermitidos={["JEFATURA"]}
        motivo="El tablero de métricas operativas y tiempos de resolución está reservado para la jefatura de operaciones."
      />
    );
  }

  const cargando = solicitudes === null;
  const lista = solicitudes ?? SOLICITUDES_MUESTRA;
  const usuariosMap = new Map(getUsuarios().map((u) => [u.id, u]));

  const ahora = Date.now();
  const enPeriodo =
    periodo === "CUSTOM"
      ? lista.filter((solicitud) => {
          const t = new Date(solicitud.creadaEn).getTime();
          const inicio = fechaDesde
            ? new Date(`${fechaDesde}T00:00:00`).getTime()
            : -Infinity;
          const fin = fechaHasta
            ? new Date(`${fechaHasta}T23:59:59.999`).getTime()
            : Infinity;
          return t >= inicio && t <= fin;
        })
      : DIAS_POR_PERIODO[periodo] === null
        ? lista
        : lista.filter(
            (solicitud) =>
              ahora - new Date(solicitud.creadaEn).getTime() <=
              (DIAS_POR_PERIODO[periodo] as number) * 86400000,
          );

  const etiquetaPeriodo =
    periodo === "TODO"
      ? "todo el histórico"
      : periodo === "7D"
        ? "los últimos 7 días"
        : periodo === "30D"
          ? "este mes (30 días)"
          : periodo === "90D"
            ? "el último trimestre (90 días)"
            : formatearRangoEtiqueta(fechaDesde, fechaHasta);

  const totales = enPeriodo.length;
  const porEstado: Record<Estado, number> = {
    REGISTRADA: enPeriodo.filter((s) => s.estado === "REGISTRADA").length,
    EN_PROCESO: enPeriodo.filter((s) => s.estado === "EN_PROCESO").length,
    CERRADA: enPeriodo.filter((s) => s.estado === "CERRADA").length,
  };
  const abiertas = porEstado.REGISTRADA + porEstado.EN_PROCESO;
  const cerradas = porEstado.CERRADA;

  const cerradasConFecha = enPeriodo.filter(
    (s) => s.estado === "CERRADA" && s.cerradaEn,
  );
  const tiempoMedioHoras =
    cerradasConFecha.length > 0
      ? Number(
          (
            cerradasConFecha.reduce((total, solicitud) => {
              const inicio = new Date(solicitud.creadaEn).getTime();
              const fin = new Date(solicitud.cerradaEn as string).getTime();
              return total + Math.max(1, (fin - inicio) / 3600000);
            }, 0) / cerradasConFecha.length
          ).toFixed(1),
        )
      : null;

  const porcentajeCumplimiento =
    totales > 0 ? Math.round((cerradas / totales) * 100) : 0;

  const pctPorEstado = (estado: Estado) =>
    totales > 0 ? Math.round((porEstado[estado] / totales) * 100) : 0;

  const statsPeriodo = [
    {
      estado: "REGISTRADA" as Estado,
      label: "Pendientes",
      pct: pctPorEstado("REGISTRADA"),
      total: porEstado.REGISTRADA,
      dot: DOT_ESTADO.REGISTRADA,
    },
    {
      estado: "EN_PROCESO" as Estado,
      label: "En proceso",
      pct: pctPorEstado("EN_PROCESO"),
      total: porEstado.EN_PROCESO,
      dot: DOT_ESTADO.EN_PROCESO,
    },
    {
      estado: "CERRADA" as Estado,
      label: "Cerradas",
      pct: pctPorEstado("CERRADA"),
      total: porEstado.CERRADA,
      dot: DOT_ESTADO.CERRADA,
    },
  ];

  const porPrioridad = OPCIONES_PRIORIDAD.map((opcion) => ({
    ...opcion,
    total: enPeriodo.filter((s) => s.prioridad === opcion.id).length,
    pct: totales > 0 ? Math.round((enPeriodo.filter((s) => s.prioridad === opcion.id).length / totales) * 100) : 0,
  }));

  // Colores SVG por prioridad (alineados con los tokens Radix)
  const SVG_COLOR: Record<string, string> = {
    BAJA:    "var(--color-grayscale-7, #888)",
    MEDIA:   "var(--color-amber-8,   #d97706)",
    ALTA:    "var(--color-orange-8,  #ea580c)",
    URGENTE: "var(--color-red-8,     #dc2626)",
  };

  const dentroDeMeta =
    tiempoMedioHoras !== null && tiempoMedioHoras <= META_HORAS;
  const avanceMeta =
    tiempoMedioHoras !== null
      ? Math.min(100, Math.round((tiempoMedioHoras / META_HORAS) * 100))
      : 0;

  // Desglose por departamento + cumplimiento SLA
  const departamentosMap = new Map<
    string,
    {
      departamento: string;
      totales: number;
      abiertas: number;
      cerradas: number;
      slaEnMeta: number;
      horasAcumuladas: number;
      conCierre: number;
    }
  >();

  let totalSlaEnMeta = 0;
  for (const sol of enPeriodo) {
    const sla = calcularEstadoSla(sol, ahora);
    const cumpleSla =
      sla.estadoSla === "EN_MARGEN" || sla.estadoSla === "CUMPLIDO";
    if (cumpleSla) totalSlaEnMeta += 1;

    const dep =
      usuariosMap.get(sol.creadorId)?.departamento ?? "Área general";
    const actual = departamentosMap.get(dep) ?? {
      departamento: dep,
      totales: 0,
      abiertas: 0,
      cerradas: 0,
      slaEnMeta: 0,
      horasAcumuladas: 0,
      conCierre: 0,
    };

    actual.totales += 1;
    if (sol.estado === "CERRADA") {
      actual.cerradas += 1;
      if (sol.cerradaEn) {
        const hrs = Math.max(
          0.5,
          (new Date(sol.cerradaEn).getTime() -
            new Date(sol.creadaEn).getTime()) /
            3600000,
        );
        actual.horasAcumuladas += hrs;
        actual.conCierre += 1;
      }
    } else {
      actual.abiertas += 1;
    }
    if (cumpleSla) actual.slaEnMeta += 1;

    departamentosMap.set(dep, actual);
  }

  const porDepartamento = Array.from(departamentosMap.values())
    .map((d) => ({
      ...d,
      pctCarga: totales > 0 ? Math.round((d.totales / totales) * 100) : 0,
      pctSla: d.totales > 0 ? Math.round((d.slaEnMeta / d.totales) * 100) : 100,
      tiempoMedio:
        d.conCierre > 0
          ? Number((d.horasAcumuladas / d.conCierre).toFixed(1))
          : null,
    }))
    .sort((a, b) => b.totales - a.totales);

  const porcentajeSlaGlobal =
    totales > 0 ? Math.round((totalSlaEnMeta / totales) * 100) : 100;

  const exportarCsv = () => {
    const filas: string[] = [];
    filas.push(
      ["REPORTE EJECUTIVO DE MANTENIMIENTO", etiquetaPeriodo]
        .map(escaparCsv)
        .join(","),
    );
    filas.push(
      ["Generado por", nombreLimpio(usuario.nombre), "Fecha", fechaInputHoy()]
        .map(escaparCsv)
        .join(","),
    );
    filas.push("");
    filas.push(
      [
        "KPI",
        "Valor",
      ]
        .map(escaparCsv)
        .join(","),
    );
    filas.push(["Total solicitudes", totales].map(escaparCsv).join(","));
    filas.push(["Pendientes", porEstado.REGISTRADA].map(escaparCsv).join(","));
    filas.push(["En proceso", porEstado.EN_PROCESO].map(escaparCsv).join(","));
    filas.push(["Cerradas", cerradas].map(escaparCsv).join(","));
    filas.push(
      ["Efectividad de cierre (%)", `${porcentajeCumplimiento}%`]
        .map(escaparCsv)
        .join(","),
    );
    filas.push(
      [
        "Tiempo medio resolución (h)",
        tiempoMedioHoras === null ? "Sin datos" : `${tiempoMedioHoras} h`,
      ]
        .map(escaparCsv)
        .join(","),
    );
    filas.push(
      ["Cumplimiento SLA global (%)", `${porcentajeSlaGlobal}%`]
        .map(escaparCsv)
        .join(","),
    );
    filas.push("");
    filas.push(
      [
        "Departamento",
        "Totales",
        "Abiertas",
        "Cerradas",
        "Tiempo medio (h)",
        "Cumplimiento SLA (%)",
      ]
        .map(escaparCsv)
        .join(","),
    );
    for (const dep of porDepartamento) {
      filas.push(
        [
          dep.departamento,
          dep.totales,
          dep.abiertas,
          dep.cerradas,
          dep.tiempoMedio ?? "—",
          `${dep.pctSla}%`,
        ]
          .map(escaparCsv)
          .join(","),
      );
    }
    filas.push("");
    filas.push(
      [
        "ID",
        "Título",
        "Departamento",
        "Ubicación",
        "Prioridad",
        "Estado",
        "SLA",
        "Fecha creación",
        "Fecha cierre",
      ]
        .map(escaparCsv)
        .join(","),
    );
    for (const sol of enPeriodo) {
      const dep =
        usuariosMap.get(sol.creadorId)?.departamento ?? "Área general";
      const sla = calcularEstadoSla(sol, ahora);
      filas.push(
        [
          sol.id,
          sol.titulo,
          dep,
          sol.ubicacion,
          sol.prioridad,
          sol.estado,
          sla.etiquetaEstado,
          sol.creadaEn.slice(0, 16).replace("T", " "),
          sol.cerradaEn ? sol.cerradaEn.slice(0, 16).replace("T", " ") : "—",
        ]
          .map(escaparCsv)
          .join(","),
      );
    }

    const blob = new Blob([`\uFEFF${filas.join("\n")}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `reporte-mantenimiento-${fechaInputHoy()}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
  };

  const exportarPdf = () => {
    const ventana = window.open("", "_blank", "width=960,height=720");
    if (!ventana) {
      window.print();
      return;
    }

    const filasDepartamentos = porDepartamento
      .map(
        (d) =>
          `<tr>
            <td>${escaparHtml(d.departamento)}</td>
            <td class="num">${d.totales}</td>
            <td class="num">${d.abiertas}</td>
            <td class="num">${d.cerradas}</td>
            <td class="num">${d.tiempoMedio !== null ? `${d.tiempoMedio} h` : "—"}</td>
            <td class="num">${d.pctSla}%</td>
          </tr>`,
      )
      .join("");

    const filasSolicitudes = enPeriodo
      .map((s) => {
        const dep =
          usuariosMap.get(s.creadorId)?.departamento ?? "Área general";
        const sla = calcularEstadoSla(s, ahora);
        return `<tr>
          <td class="mono">${escaparHtml(s.id)}</td>
          <td>${escaparHtml(s.titulo)}</td>
          <td>${escaparHtml(dep)}</td>
          <td>${escaparHtml(s.prioridad)}</td>
          <td>${escaparHtml(s.estado)}</td>
          <td>${escaparHtml(sla.etiquetaEstado)}</td>
        </tr>`;
      })
      .join("");

    ventana.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Reporte Ejecutivo de Mantenimiento | ${escaparHtml(fechaInputHoy())}</title>
  <style>
    @page { margin: 18mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Inter", sans-serif; color: #18181b; margin: 0; padding: 24px; line-height: 1.45; }
    .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid #e4e4e7; padding-bottom: 14px; margin-bottom: 20px; }
    .eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a; }
    h1 { font-size: 22px; margin: 4px 0 0; letter-spacing: -0.02em; }
    .meta { text-align: right; font-size: 11px; color: #52525b; font-family: ui-monospace, monospace; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .kpi { border: 1px solid #e4e4e7; border-radius: 10px; padding: 12px 14px; background: #fafafa; }
    .kpi-label { font-size: 11px; color: #71717a; }
    .kpi-val { font-size: 22px; font-weight: 700; margin-top: 4px; font-family: ui-monospace, monospace; }
    h2 { font-size: 14px; margin: 22px 0 10px; letter-spacing: -0.01em; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border-bottom: 1px solid #e4e4e7; padding: 8px 10px; text-align: left; }
    th { font-size: 11px; color: #52525b; background: #f4f4f5; font-weight: 600; }
    .num { text-align: right; font-family: ui-monospace, monospace; }
    .mono { font-family: ui-monospace, monospace; font-size: 11px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="eyebrow">Servicios Internos | Mantenimiento</div>
      <h1>Balance Operativo e Indicadores</h1>
    </div>
    <div class="meta">
      <div>Período: ${escaparHtml(etiquetaPeriodo)}</div>
      <div>Emitido: ${escaparHtml(fechaInputHoy())} | ${escaparHtml(nombreLimpio(usuario.nombre))}</div>
    </div>
  </div>

  <div class="kpis">
    <div class="kpi"><div class="kpi-label">Total solicitudes</div><div class="kpi-val">${totales}</div></div>
    <div class="kpi"><div class="kpi-label">Cerradas (${porcentajeCumplimiento}%)</div><div class="kpi-val">${cerradas}</div></div>
    <div class="kpi"><div class="kpi-label">Tiempo medio</div><div class="kpi-val">${tiempoMedioHoras !== null ? `${tiempoMedioHoras}h` : "—"}</div></div>
    <div class="kpi"><div class="kpi-label">Cumplimiento SLA</div><div class="kpi-val">${porcentajeSlaGlobal}%</div></div>
  </div>

  <h2>Distribución y desempeño por departamento</h2>
  <table>
    <thead>
      <tr>
        <th>Departamento</th>
        <th class="num">Totales</th>
        <th class="num">Abiertas</th>
        <th class="num">Cerradas</th>
        <th class="num">Tiempo medio</th>
        <th class="num">SLA en meta</th>
      </tr>
    </thead>
    <tbody>${filasDepartamentos || '<tr><td colspan="6">Sin registros en el período.</td></tr>'}</tbody>
  </table>

  <h2>Detalle de solicitudes del período</h2>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Título</th>
        <th>Departamento</th>
        <th>Prioridad</th>
        <th>Estado</th>
        <th>SLA</th>
      </tr>
    </thead>
    <tbody>${filasSolicitudes || '<tr><td colspan="6">Sin solicitudes en el período.</td></tr>'}</tbody>
  </table>
</body>
</html>`);
    ventana.document.close();
    ventana.focus();
    setTimeout(() => {
      ventana.print();
    }, 250);
  };

  return (
    <div className="flex flex-1 flex-col justify-between gap-6 md:gap-7">
      <div className="flex flex-col gap-4 md:gap-5">
        <PageHeader
          codigo="I08"
          eyebrow="Jefatura de operaciones"
          titulo="Resumen e indicadores"
          acciones={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={exportarCsv}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-xl border border-grayscale-3 bg-white px-3 text-[12px] font-medium text-grayscale-11 shadow-2xs transition-[border-color,background-color,color,transform] duration-150 ease-[var(--ease-out-soft)] hover:border-grayscale-5 hover:text-grayscale-12 active:scale-[0.97] dark:border-white/[0.12] dark:bg-[#161614]"
              >
                <DownloadSimpleIcon size={13} weight="bold" />
                <span>Exportar CSV</span>
              </button>

              <button
                type="button"
                onClick={exportarPdf}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-xl border border-grayscale-4 bg-grayscale-12 px-3 text-[12px] font-medium text-grayscale-1 shadow-2xs transition-[background-color,transform,opacity] duration-150 ease-[var(--ease-out-soft)] hover:opacity-90 active:scale-[0.97] dark:bg-grayscale-12 dark:text-grayscale-1"
              >
                <FileTextIcon size={13} weight="bold" />
                <span>Reporte PDF</span>
              </button>

              <span className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-grayscale-2 px-2.5 text-[11px] text-grayscale-10 dark:bg-grayscale-2/70">
                <EyeIcon size={12} weight="bold" />
                Solo lectura
              </span>
            </div>
          }
        />

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              items={PERIODOS}
              value={periodo}
              onChange={setPeriodo}
              ariaLabel="Filtrar indicadores por período"
            />
            <DateRangePicker
              desde={fechaDesde}
              hasta={fechaHasta}
              activo={periodo === "CUSTOM"}
              fechasConActividad={lista.map((s) => s.creadaEn)}
              onActivate={() => setPeriodo("CUSTOM")}
              onChange={({ desde, hasta }) => {
                setFechaDesde(desde);
                setFechaHasta(hasta);
                setPeriodo("CUSTOM");
              }}
              onClear={() => setPeriodo("TODO")}
            />
          </div>
          <p className="inline-flex items-center gap-1 text-[11.5px] leading-snug text-grayscale-9 md:max-w-[42%] md:justify-end md:text-right">
            <SlotNumber
              value={totales}
              className="font-semibold text-grayscale-11"
            />
            <span>
              {totales === 1
                ? "solicitud considerada"
                : "solicitudes consideradas"}{" "}
              en {etiquetaPeriodo}
            </span>
          </p>
        </div>

        <SkeletonContent
          id="indicadores-contenido"
          loading={cargando}
          minLoadMs={300}
          label="Cargando indicadores"
        >
          <div className="flex flex-col gap-4 md:gap-5">
            <section className="stagger grid grid-cols-2 gap-3.5 lg:grid-cols-4 md:gap-4">
              <MetricCard
                label="Total"
                valor={totales}
                unidad="Solicitudes"
                detalle="Consolidadas en el período"
                dot="bg-grayscale-8"
                icon={TrendUpIcon}
                delay={0}
              />
              <MetricCard
                label="Pendientes"
                valor={porEstado.REGISTRADA}
                detalle="Sin diagnóstico asignado"
                dot="bg-amber-8"
                tono="amber"
                total={totales}
                icon={HourglassIcon}
                delay={1}
              />
              <MetricCard
                label="En atención"
                valor={porEstado.EN_PROCESO}
                detalle="Técnico en labores"
                dot="bg-blue-8"
                tono="blue"
                total={totales}
                icon={ClockIcon}
                delay={2}
              />
              <MetricCard
                label="Cerradas"
                valor={cerradas}
                detalle={`${porcentajeCumplimiento}% de efectividad`}
                dot="bg-green-8"
                tono="emerald"
                total={totales}
                icon={CheckCircleIcon}
                delay={3}
              />
            </section>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 md:gap-4">
              {/* MTTR */}
              <section className="card flex flex-col rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.22] dark:bg-[#191917]">
                <div className="flex flex-1 flex-col justify-between gap-4 rounded-[1rem] border border-grayscale-3/60 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.08] dark:bg-[#121211]">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span
                        skullet-block=""
                        className="flex size-6.5 items-center justify-center rounded-lg bg-grayscale-2 text-grayscale-10 dark:bg-grayscale-3"
                      >
                        <ClockIcon size={13} />
                      </span>
                      <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-grayscale-12">
                        Tiempo medio de resolución
                      </h2>
                    </div>

                    <div className="flex items-baseline gap-2">
                      {tiempoMedioHoras === null ? (
                        <span className="num text-[32px] font-bold leading-none tracking-[-0.03em] text-grayscale-12 font-mono">
                          —
                        </span>
                      ) : (
                        <SlotNumber
                          value={tiempoMedioHoras}
                          decimals={1}
                          className="text-[32px] font-bold leading-none tracking-[-0.03em] text-grayscale-12 font-mono"
                        />
                      )}
                      <span className="text-[11.5px] text-grayscale-9">
                        {tiempoMedioHoras === null
                          ? "sin cierres en el período"
                          : "horas promedio"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-grayscale-9">
                      <span className="flex items-center gap-1.5">
                        <TargetIcon size={13} />
                        Meta corporativa | {META_HORAS} h
                      </span>
                      <span
                        className={cn(
                          "font-medium",
                          tiempoMedioHoras === null
                            ? "text-grayscale-9"
                            : dentroDeMeta
                              ? "text-grayscale-11"
                              : "text-grayscale-11",
                        )}
                      >
                        {tiempoMedioHoras === null
                          ? "Sin datos"
                          : dentroDeMeta
                            ? "En meta"
                            : "Fuera de meta"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-grayscale-3">
                      <div
                        className={cn(
                          "h-full w-full origin-left rounded-full transition-transform duration-[280ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
                          dentroDeMeta ? "bg-emerald-500" : "bg-amber-500",
                        )}
                        style={{
                          transform: `scaleX(${montado ? avanceMeta / 100 : 0})`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between px-4 py-2 text-[11px]">
                  <span className="flex items-center gap-1.5 text-grayscale-10">
                    <TargetIcon size={12} className="text-grayscale-8" />
                    Tasa de cumplimiento
                  </span>
                  <SlotNumber
                    value={porcentajeCumplimiento}
                    suffix="%"
                    className="font-bold text-grayscale-12 font-mono text-[12px]"
                  />
                </div>
              </section>

              {/* Distribución por estado */}
              <section className="card flex flex-col rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.22] dark:bg-[#191917]">
                <div className="flex flex-1 flex-col justify-between gap-3.5 rounded-[1rem] border border-grayscale-3/60 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.08] dark:bg-[#121211]">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          skullet-block=""
                          className="flex size-6.5 items-center justify-center rounded-lg bg-grayscale-2 text-grayscale-10 dark:bg-grayscale-3"
                        >
                          <TrendUpIcon size={13} />
                        </span>
                        <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-grayscale-12">
                          Distribución por estado
                        </h2>
                      </div>
                      <Link
                        href="/mantenimiento"
                        className="group inline-flex items-center gap-1 text-[11px] font-medium text-grayscale-10 transition-colors hover:text-grayscale-12"
                      >
                        Bandeja
                        <ArrowRightIcon
                          size={11}
                          className="transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5"
                        />
                      </Link>
                    </div>

                    <div className="flex h-3.5 w-full gap-1 overflow-hidden">
                      <div
                        className="rounded-l-md bg-amber-500/70 transition-[width] duration-[280ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                        style={{
                          width: montado ? `${pctPorEstado("REGISTRADA")}%` : "0%",
                        }}
                        title={`Pendientes: ${pctPorEstado("REGISTRADA")}%`}
                      />
                      <div
                        className="bg-blue-500/70 transition-[width] duration-[280ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                        style={{
                          width: montado ? `${pctPorEstado("EN_PROCESO")}%` : "0%",
                        }}
                        title={`En proceso: ${pctPorEstado("EN_PROCESO")}%`}
                      />
                      <div
                        className="rounded-r-md bg-grayscale-8 transition-[width] duration-[280ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                        style={{
                          width: montado ? `${pctPorEstado("CERRADA")}%` : "0%",
                        }}
                        title={`Cerradas: ${pctPorEstado("CERRADA")}%`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    {statsPeriodo.map((fila) => (
                      <Link
                        key={fila.estado}
                        href={`/mantenimiento?estado=${fila.estado}`}
                        className="group flex items-center justify-between gap-3 rounded-lg px-2 py-1 text-[11.5px] transition-colors duration-150 hover:bg-grayscale-2 dark:hover:bg-grayscale-3/60"
                      >
                        <span className="flex min-w-0 items-center gap-2 text-grayscale-10">
                          <span
                            className={cn("size-1.5 shrink-0 rounded-full", fila.dot)}
                          />
                          <span className="truncate">{fila.label}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5 text-[11.5px] text-grayscale-10">
                          <SlotNumber
                            value={fila.total}
                            className="font-mono text-[11.5px] text-grayscale-11 font-medium"
                          />
                          <span>|</span>
                          <SlotNumber
                            value={fila.pct}
                            suffix="%"
                            className="font-mono text-[11.5px] text-grayscale-9 font-medium"
                          />
                          <ArrowRightIcon
                            size={10}
                            className="text-grayscale-7 transition-transform duration-150 ease-[var(--ease-out-soft)] group-hover:translate-x-0.5 group-hover:text-grayscale-10"
                          />
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-4 py-2 text-[11px] text-grayscale-9">
                  <SlotNumber
                    value={abiertas}
                    className="font-bold text-grayscale-12 font-mono text-[11.5px]"
                  />
                  <span>requerimientos abiertos en este momento.</span>
                </div>
              </section>
            </div>

            {/* ── Distribución por prioridad ── */}
            <section className="card flex flex-col rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.22] dark:bg-[#191917]">
              <div className="flex-1 rounded-[1rem] border border-grayscale-3/60 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.08] dark:bg-[#121211]">

                {/* Cabecera */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      skullet-block=""
                      className="flex size-6.5 items-center justify-center rounded-lg bg-grayscale-2 text-grayscale-10 dark:bg-grayscale-3"
                    >
                      <WarningIcon size={13} />
                    </span>
                    <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-grayscale-12">
                      Carga por prioridad
                    </h2>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] text-grayscale-9">
                    <SlotNumber value={totales} className="font-semibold text-grayscale-11 text-[11px]" />
                    <span>solicitudes en el período</span>
                  </span>
                </div>

                {/* Layout: donut izquierda + lista derecha */}
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-8">

                  {/* Donut SVG */}
                  <div className="relative mx-auto shrink-0 lg:mx-1" style={{ width: 124, height: 124 }}>
                    <svg width="124" height="124" viewBox="0 0 124 124" fill="none" className="rotate-[-90deg] rounded-full">
                      {(() => {
                        const r = 47;
                        const stroke = 13;
                        const circ = 2 * Math.PI * r;
                        const gap = 2; // px de espacio entre arcos

                        // Calculamos los arcos acumulados
                        type Arc = { id: string; pct: number; total: number };
                        const arcs: Arc[] = porPrioridad
                          .filter((p) => p.total > 0)
                          .map((p) => ({
                            id: p.id,
                            pct: p.pct,
                            total: p.total,
                          }));

                        if (arcs.length === 0) {
                          // Anillo vacío
                          return (
                            <circle
                              cx="62" cy="62" r={r}
                              stroke="var(--color-grayscale-3, #e5e5e5)"
                              strokeWidth={stroke}
                              fill="none"
                            />
                          );
                        }

                        let offset = 0;
                        return arcs.map((arc) => {
                          const dash = Math.max(0, (arc.pct / 100) * circ - gap);
                          const spacer = circ - dash;
                          const el = (
                            <circle
                              key={arc.id}
                              cx="62" cy="62" r={r}
                              stroke={SVG_COLOR[arc.id]}
                              strokeWidth={stroke}
                              strokeLinecap="round"
                              strokeDasharray={`${dash} ${spacer}`}
                              strokeDashoffset={-offset}
                              fill="none"
                              className="transition-[stroke-dasharray,stroke-dashoffset] duration-[280ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                            />
                          );
                          offset += (arc.pct / 100) * circ;
                          return el;
                        });
                      })()}
                      {/* Pista de fondo */}
                      <circle
                        cx="62" cy="62" r={47}
                        stroke="var(--color-grayscale-3, #e5e5e5)"
                        strokeWidth={13}
                        fill="none"
                        className="opacity-30"
                      />
                    </svg>

                    {/* Centro: número total */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0 pointer-events-none">
                      <SlotNumber
                        value={totales}
                        className="text-[22px] font-bold leading-none tracking-tight text-grayscale-12 font-mono"
                      />
                      <span className="mt-0.5 text-[8.5px] font-medium uppercase tracking-widest text-grayscale-8">
                        Total
                      </span>
                    </div>
                  </div>

                  {/* Lista de prioridades */}
                  <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 min-w-0">
                    {porPrioridad.map((fila) => {
                      const urgente = fila.id === "URGENTE";
                      return (
                        <Link
                          key={fila.id}
                          href={`/mantenimiento?prioridad=${fila.id}`}
                          className="group flex items-center justify-between gap-2.5 rounded-xl border border-grayscale-3/70 bg-grayscale-1/60 px-3.5 py-2.5 transition-[border-color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-grayscale-4 hover:bg-grayscale-2/70 active:scale-[0.985] dark:border-white/[0.1] dark:bg-[#171715] dark:hover:bg-grayscale-3/60"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            {/* Rank / nivel glifo */}
                            <span
                              aria-hidden
                              skullet-block=""
                              className="flex shrink-0 items-end gap-[2px] h-3.5"
                            >
                              {[1,2,3,4].map((n) => (
                                <span
                                  key={n}
                                  className={cn(
                                    "w-[2.5px] rounded-sm transition-colors duration-200",
                                    n <= fila.nivel
                                      ? fila.dot
                                      : "bg-grayscale-3/80 dark:bg-grayscale-4/50"
                                  )}
                                  style={{ height: 3 + n * 2.5 }}
                                />
                              ))}
                            </span>

                            {/* Label + hint */}
                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <span className={cn(
                                "text-[12px] font-semibold leading-none",
                                urgente ? "text-red-11 dark:text-red-9" : "text-grayscale-12"
                              )}>
                                {fila.label}
                              </span>
                              <span className="truncate text-[10.5px] text-grayscale-9">
                                {fila.hint}
                              </span>
                            </div>
                          </div>

                          {/* Barra waffle + número */}
                          <div className="flex shrink-0 items-center gap-2.5">
                            {/* Mini barra segmentada en 10 slots */}
                            <span
                              skullet-block=""
                              className="hidden sm:flex items-center gap-[2px]"
                              aria-hidden
                            >
                              {Array.from({ length: 10 }).map((_, i) => {
                                const llena = i < Math.round(fila.pct / 10);
                                return (
                                  <span
                                    key={i}
                                    className={cn(
                                      "h-[5px] w-[4px] rounded-[1.5px] transition-colors duration-200",
                                      llena ? fila.dot : "bg-grayscale-3/70 dark:bg-grayscale-4/40"
                                    )}
                                  />
                                );
                              })}
                            </span>

                            <span className="flex flex-col items-end leading-none gap-0.5">
                              <SlotNumber
                                value={fila.total}
                                className="text-[13px] font-bold text-grayscale-12 font-mono"
                              />
                              <SlotNumber
                                value={fila.pct}
                                suffix="%"
                                className="text-[9.5px] text-grayscale-8 font-mono"
                              />
                            </span>

                            <ArrowRightIcon
                              size={10}
                              className="text-grayscale-6 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5 group-hover:text-grayscale-10"
                            />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="px-4 py-2 text-[11px] text-grayscale-9">
                Distribución de carga de trabajo por severidad
              </div>
            </section>

            {/* Distribución y SLA por departamento */}
            <section className="card flex flex-col rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.22] dark:bg-[#191917]">
              <div className="rounded-[1rem] border border-grayscale-3/60 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.08] dark:bg-[#121211] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      skullet-block=""
                      className="flex size-6.5 items-center justify-center rounded-lg bg-grayscale-2 text-grayscale-10 dark:bg-grayscale-3"
                    >
                      <BuildingsIcon size={13} />
                    </span>
                    <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-grayscale-12">
                      Distribución y SLA por departamento
                    </h2>
                  </div>

                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-grayscale-10">
                    <span>SLA en meta:</span>
                    <SlotNumber
                      value={porcentajeSlaGlobal}
                      suffix="%"
                      className="font-bold text-grayscale-12"
                    />
                  </span>
                </div>

                {porDepartamento.length === 0 ? (
                  <p className="py-3 text-[12px] text-grayscale-9">
                    No hay solicitudes registradas dentro del rango seleccionado.
                  </p>
                ) : (
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {porDepartamento.map((dep) => (
                      <div
                        key={dep.departamento}
                        className="rounded-xl border border-grayscale-3/70 bg-grayscale-1/60 p-3.5 dark:border-white/[0.1] dark:bg-[#171715]"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-[12.5px] font-semibold text-grayscale-12">
                            {dep.departamento}
                          </span>
                          <span className="shrink-0 font-mono text-[11px] text-grayscale-9">
                            <SlotNumber
                              value={dep.totales}
                              className="font-bold text-grayscale-12"
                            />{" "}
                            | {dep.pctCarga}%
                          </span>
                        </div>

                        <div
                          skullet-block=""
                          className="mt-2.5 grid grid-cols-12 gap-1"
                          aria-hidden
                        >
                          {Array.from({ length: 12 }).map((_, i) => {
                            const lleno = i < Math.max(1, Math.round((dep.pctCarga / 100) * 12));
                            return (
                              <div
                                key={i}
                                className={cn(
                                  "h-1.5 w-full rounded-[2px]",
                                  lleno
                                    ? dep.pctSla >= 75
                                      ? "bg-emerald-600/80"
                                      : "bg-amber-500/80"
                                    : "bg-grayscale-3/75 dark:bg-grayscale-4/40",
                                )}
                              />
                            );
                          })}
                        </div>

                        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px] text-grayscale-9">
                          <span>
                            {dep.cerradas} cerradas | {dep.abiertas} abiertas
                          </span>
                          <span>
                            {dep.tiempoMedio !== null
                              ? `${dep.tiempoMedio}h prom | `
                              : ""}
                            SLA {dep.pctSla}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-4 py-2 text-[11px] text-grayscale-9">
                Desempeño técnico segmentado por área solicitante
              </div>
            </section>

            {/* Metas operativas y de sostenibilidad */}
            <section className="card rounded-[1.25rem] border border-grayscale-4/90 bg-grayscale-2 p-1 shadow-2xs dark:border-white/[0.22] dark:bg-[#191917]">
              <div className="rounded-[1rem] border border-grayscale-3/60 bg-white p-5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] dark:border-white/[0.08] dark:bg-[#121211] space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      skullet-block=""
                      className="flex size-6.5 items-center justify-center rounded-lg bg-grayscale-2 text-grayscale-10 dark:bg-grayscale-3"
                    >
                      <TargetIcon size={13} />
                    </span>
                    <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-grayscale-12">
                      Metas operativas y de eficiencia del servicio
                    </h2>
                  </div>
                  <span className="rounded-md bg-grayscale-2 px-2 py-0.5 font-mono text-[10px] font-medium text-grayscale-10">
                    Objetivos del área
                  </span>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-3">
                  {/* 1. Tiempo medio de atención: comparador visual vs base 72h y meta 48h */}
                  {(() => {
                    const baseH = METAS_ACADEMICAS_ODS12.tiempoMedio.baseHoras;
                    const metaH = METAS_ACADEMICAS_ODS12.tiempoMedio.metaHoras;
                    const actualH = tiempoMedioHoras ?? 0;
                    const pctActual =
                      tiempoMedioHoras !== null
                        ? Math.min(100, Math.round((actualH / baseH) * 100))
                        : 0;
                    const pctMeta = Math.round((metaH / baseH) * 100);
                    const mejoraPct =
                      tiempoMedioHoras !== null && actualH < baseH
                        ? Math.round(((baseH - actualH) / baseH) * 100)
                        : null;
                    const cumple =
                      tiempoMedioHoras !== null && actualH <= metaH;

                    return (
                      <div className="surface-soft flex flex-col justify-between rounded-xl p-4">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-medium text-grayscale-9">
                              Tiempo medio
                            </span>
                            {mejoraPct !== null ? (
                              <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                                -{mejoraPct}% vs {baseH}h
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-1.5 flex items-baseline gap-1.5 font-mono">
                            <span className="text-[22px] font-bold tracking-tight text-grayscale-12 tabular-nums">
                              {tiempoMedioHoras !== null
                                ? `${tiempoMedioHoras}h`
                                : "—"}
                            </span>
                            <span className="text-[11px] text-grayscale-9">
                              / {metaH}h objetivo
                            </span>
                          </div>
                        </div>

                        <div className="mt-5 space-y-1.5">
                          <div className="relative pt-4">
                            <span
                              className="absolute top-0 -translate-x-1/2 whitespace-nowrap font-mono text-[9.5px] font-medium text-grayscale-10"
                              style={{ left: `${pctMeta}%` }}
                            >
                              Meta ≤ {metaH}h
                            </span>
                            <div className="relative h-4 w-full overflow-hidden rounded-md bg-grayscale-3/80 dark:bg-white/[0.07]">
                              <div
                                className={cn(
                                  "h-full rounded-md transition-[width] duration-300 ease-[var(--ease-out-soft)]",
                                  cumple ? "bg-emerald-500/85" : "bg-amber-500/85",
                                )}
                                style={{ width: `${pctActual}%` }}
                              />
                              <span
                                aria-hidden
                                className="absolute top-0 bottom-0 w-[1.5px] -translate-x-1/2 bg-grayscale-12/70 dark:bg-white/70"
                                style={{ left: `${pctMeta}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between font-mono text-[10px] text-grayscale-9">
                            <span>
                              Actual:{" "}
                              {tiempoMedioHoras !== null
                                ? `${tiempoMedioHoras}h`
                                : "—"}
                            </span>
                            <span>Antes: {baseH}h</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 2. Satisfacción CSAT: 10 segmentos visuales con umbral 80% */}
                  {(() => {
                    const csat = getResumenSatisfaccion();
                    const pct = csat.total > 0 ? csat.porcentajeFavorable : 0;
                    const metaPct =
                      METAS_ACADEMICAS_ODS12.satisfaccion.metaPorcentaje;
                    const basePct =
                      METAS_ACADEMICAS_ODS12.satisfaccion.basePorcentaje;
                    const segmentosActivos = Math.round(pct / 10);

                    return (
                      <div className="surface-soft flex flex-col justify-between rounded-xl p-4">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-medium text-grayscale-9">
                              Satisfacción CSAT
                            </span>
                            {csat.total > 0 ? (
                              <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                                {csat.promedio}/5 ★
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-1.5 flex items-baseline gap-1.5 font-mono">
                            <span className="text-[22px] font-bold tracking-tight text-grayscale-12 tabular-nums">
                              {csat.total > 0 ? `${pct}%` : "—"}
                            </span>
                            <span className="text-[11px] text-grayscale-9">
                              / {metaPct}% meta
                            </span>
                          </div>
                        </div>

                        <div className="mt-5 space-y-1.5">
                          <div className="relative pt-4">
                            <span
                              className="absolute top-0 -translate-x-1/2 whitespace-nowrap font-mono text-[9.5px] font-medium text-grayscale-10"
                              style={{ left: `calc(${metaPct}% + 1.2px)` }}
                            >
                              Meta ≥ {metaPct}%
                            </span>
                            <div className="relative grid grid-cols-10 h-4 gap-1" aria-hidden>
                              {Array.from({ length: 10 }).map((_, idx) => (
                                <span
                                  key={idx}
                                  className={cn(
                                    "rounded-[3px] transition-colors duration-200",
                                    idx < segmentosActivos
                                      ? pct >= metaPct
                                        ? "bg-emerald-500/85"
                                        : "bg-amber-500/85"
                                      : "bg-grayscale-3/80 dark:bg-white/[0.07]",
                                  )}
                                />
                              ))}
                              <span
                                className="pointer-events-none absolute -top-0.5 -bottom-0.5 w-[1.5px] -translate-x-1/2 bg-grayscale-12/70 dark:bg-white/70"
                                style={{ left: `calc(${metaPct}% + 1.2px)` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between font-mono text-[10px] text-grayscale-9">
                            <span>Antes: {basePct}%</span>
                            <span>
                              {csat.total}{" "}
                              {csat.total === 1 ? "voto" : "votos"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 3. Cero papel (ODS 12.5): comparativa vertical Antes → Meta → Papel → Digital */}
                  {(() => {
                    const digitales = (solicitudes ?? []).length;
                    const basePapel =
                      METAS_ACADEMICAS_ODS12.formulariosFisicosMes.base;
                    const metaPapel =
                      METAS_ACADEMICAS_ODS12.formulariosFisicosMes.meta;
                    const pctMetaAltura = Math.max(
                      20,
                      Math.round((metaPapel / basePapel) * 100),
                    );
                    const pctDigitalAltura = Math.min(
                      100,
                      Math.max(18, Math.round((digitales / basePapel) * 100)),
                    );

                    return (
                      <div className="surface-soft flex flex-col justify-between rounded-xl p-4">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-medium text-grayscale-9">
                              Cero papel | ODS 12.5
                            </span>
                            <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                              -100% papel
                            </span>
                          </div>

                          <div className="mt-1.5 flex items-baseline gap-1.5 font-mono">
                            <span className="text-[22px] font-bold tracking-tight text-grayscale-12 tabular-nums">
                              0
                            </span>
                            <span className="text-[11px] text-grayscale-9">
                              hojas físicas / mes
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="grid grid-cols-4 items-end gap-2.5 border-b border-grayscale-4/70 pb-1.5 dark:border-white/[0.08]">
                            {/* Columna 1: Antes */}
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-mono text-[9.5px] text-grayscale-9 tabular-nums">
                                {basePapel}
                              </span>
                              <div className="flex h-10 w-full items-end">
                                <div className="h-full w-full rounded-t-[4px] bg-grayscale-4/85 dark:bg-white/[0.12]" />
                              </div>
                            </div>

                            {/* Columna 2: Meta */}
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-mono text-[9.5px] text-grayscale-10 tabular-nums">
                                ≤{metaPapel}
                              </span>
                              <div className="flex h-10 w-full items-end">
                                <div
                                  className="w-full rounded-t-[4px] border border-b-0 border-dashed border-grayscale-8/70 bg-grayscale-2/70 dark:border-white/30 dark:bg-white/[0.04]"
                                  style={{ height: `${pctMetaAltura}%` }}
                                />
                              </div>
                            </div>

                            {/* Columna 3: Papel hoy */}
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-mono text-[9.5px] font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                                0
                              </span>
                              <div className="flex h-10 w-full items-end">
                                <div className="h-[3px] w-full rounded-full bg-emerald-500" />
                              </div>
                            </div>

                            {/* Columna 4: Folios digitales */}
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-mono text-[9.5px] font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
                                {digitales}
                              </span>
                              <div className="flex h-10 w-full items-end">
                                <div
                                  className="w-full rounded-t-[4px] bg-blue-500/80 dark:bg-blue-400/75"
                                  style={{ height: `${pctDigitalAltura}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 text-center font-mono text-[9.5px] text-grayscale-9">
                            <span>Antes</span>
                            <span>Meta</span>
                            <span className="font-medium text-emerald-700 dark:text-emerald-400">
                              Papel
                            </span>
                            <span className="font-medium text-blue-700 dark:text-blue-400">
                              Digital
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-0.5 font-mono text-[10px] text-grayscale-9">
                            <span>Ahorro: {basePapel} hojas/mes</span>
                            <span>100% digital</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </section>

            {porcentajeCumplimiento < 50 && totales > 0 && (
              <div className="surface-soft flex items-start gap-2.5 px-4 py-3.5 text-[12px] text-grayscale-10">
                <WarningIcon
                  size={15}
                  weight="fill"
                  className="mt-px shrink-0 text-amber-600/80 dark:text-amber-400/70"
                />
                <p>
                  Menos de la mitad de las solicitudes se están cerrando en este
                  período. Conviene revisar la asignación de la cola técnica.
                </p>
              </div>
            )}
          </div>
        </SkeletonContent>
      </div>

      <BottomBar
        statusInfo={{
          title: `${totales} solicitudes consolidadas | ${etiquetaPeriodo}`,
          subtitle: `Supervisión de ${nombreLimpio(usuario.nombre)} | ${usuario.cargo}`,
        }}
        primaryLabel="Ver bandeja general"
        primaryHref="/mantenimiento"
        shortcuts={[{ key: "Esc", label: "Volver al panel" }]}
      />
    </div>
  );
}
