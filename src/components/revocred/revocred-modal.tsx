"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "@/actions/auth";
import {
  Search,
  Link,
  Edit3,
  Loader2,
  CheckCircle,
  Clock,
  X,
  CreditCard,
  Play,
  Square,
  RefreshCw,
  Calendar,
  Timer,
  Settings2,
  FileText,
  ChevronDown,
  ChevronUp,
  Database,
  Server,
} from "lucide-react";

/* ───────────── Types ───────────── */

type StepStatus = "pending" | "running" | "done" | "error" | "result";

interface SimulationStep {
  step: string;
  status: StepStatus;
  detail?: string;
}

interface PendingOrder {
  kdi: string;
  customerName: string;
  cpfCnpj: string;
  systemPower: number;
  equipmentValue: number;
  laborValue: number;
  monthlyBillValue: number;
  createdAt: string;
}

interface BatchResult {
  kdi: string;
  customerName: string;
  resultado: "APROVADO" | "REPROVADO" | "INDEFINIDO" | "ERRO";
  detail: string;
}

interface LogRecord {
  id: string;
  kdi: string;
  customer_name: string;
  cpf_cnpj: string;
  mode: string;
  status_before: string;
  resultado: string;
  resultado_detail: string;
  parcelas: Array<{ prazo: string; valor: string; taxa: string }> | null;
  steps_log: Array<{ step: string; status: string; detail?: string; timestamp: string }> | null;
  error_message: string | null;
  duration_ms: number;
  batch_date: string | null;
  status_updated_to: string | null;
  system_power: number;
  equipment_value: number;
  labor_value: number;
  monthly_bill_value: number;
  created_at: string;
}

type TabMode = "manual" | "batch";
type TargetEnv = "dev" | "prod";

// URL do servidor remoto PROD (Docker + Chromium na VM101)
const PROD_REMOTE_URL = process.env.NEXT_PUBLIC_REVOCRED_PROD_URL || "https://meo.cdxsistemas.com.br";

// Auto-detect: if running on Vercel (appmeo.com.br), always route to remote PROD server
const IS_VERCEL = typeof window !== "undefined" && window.location.hostname.includes("appmeo.com.br");

const ORDER_STATUSES = [
  { value: "analysis_pending", label: "Ag. Análise" },
  { value: "analysis_approved", label: "Aprovado" },
  { value: "analysis_rejected", label: "Reprovado" },
  { value: "documents_pending", label: "Ag. Documentos" },
  { value: "docs_analysis", label: "Análise Docs" },
  { value: "sending_distributor_invoice", label: "Envio NF Distribuidora" },
  { value: "payment_distributor", label: "Pgto. Distribuidora" },
  { value: "access_opinion", label: "Parecer de Acesso" },
  { value: "initial_payment_integrator", label: "Pagt Inicial Integrador" },
  { value: "final_payment_integrator", label: "Pagt Final Integrador" },
  { value: "finished", label: "Finalizado" },
  { value: "canceled", label: "Cancelado" },
] as const;

/* ───────────── Helpers ───────────── */

const STEP_ICONS: Record<string, React.ElementType> = {
  "Buscando dados do pedido...": Search,
  "Conectando ao RevoCred...": Link,
  "Preenchendo formulário...": Edit3,
  "Simulando crédito...": Loader2,
  "Aceitando autorização...": CheckCircle,
  "Processando resultado...": Clock,
};

function getStepIcon(stepText: string) {
  for (const [key, Icon] of Object.entries(STEP_ICONS)) {
    if (stepText.includes(key.replace("...", ""))) return Icon;
  }
  return CreditCard;
}

/* ───────────── Component ───────────── */

export default function RevocredModal() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabMode>("manual");
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserName, setCurrentUserName] = useState("Usuário");
  // On Vercel PROD, always use "prod" (remote server); on DEV, default to "dev"
  const [targetEnv, setTargetEnv] = useState<TargetEnv>(IS_VERCEL ? "prod" : "dev");

  // ─── Check if current user is admin ───
  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user.role === "admin") {
        setIsAdmin(true);
      }
      setCurrentUserName(user.name || user.email || "Usuário");
    });
  }, []);

  // ─── Manual mode state ───
  const [kdi, setKdi] = useState("");
  const [steps, setSteps] = useState<SimulationStep[]>([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SimulationStep | null>(null);
  const [completed, setCompleted] = useState(false);
  const [stepDelay, setStepDelay] = useState(2);
  const inputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // ─── Batch mode state ───
  const [batchDate, setBatchDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [useCurrentDate, setUseCurrentDate] = useState(true); // default: always use today
  const [batchStatus, setBatchStatus] = useState("analysis_pending");
  const [batchStepDelay, setBatchStepDelay] = useState(3);
  const [batchInterval, setBatchInterval] = useState(5);
  const [batchOrders, setBatchOrders] = useState<PendingOrder[]>([]);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchCurrentKdi, setBatchCurrentKdi] = useState("");
  const [batchCurrentIndex, setBatchCurrentIndex] = useState(-1);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchNextRunAt, setBatchNextRunAt] = useState<string | null>(null);
  const [batchNextRunTimestamp, setBatchNextRunTimestamp] = useState<number | null>(null);
  const [batchCountdown, setBatchCountdown] = useState("");
  const [batchCycleCount, setBatchCycleCount] = useState(0);
  const [batchSteps, setBatchSteps] = useState<SimulationStep[]>([]);
  const [expandedLogKdi, setExpandedLogKdi] = useState<string | null>(null);
  const [expandedLogData, setExpandedLogData] = useState<LogRecord | null>(null);
  const [loadingLog, setLoadingLog] = useState(false);
  const [kdisWithLogs, setKdisWithLogs] = useState<Set<string>>(new Set());
  const [activityOwner, setActivityOwner] = useState<string | null>(null);
  const batchStatusRef = useRef(batchStatus);
  const batchDateRef = useRef(batchDate);
  batchStatusRef.current = batchStatus;
  batchDateRef.current = batchDate;

  /* ───────── API URL helper: routes to DEV (local) or PROD (remote) ───────── */

  function apiUrl(path: string): string {
    if (IS_VERCEL || targetEnv === "prod") {
      // Route to remote PROD server (Docker + Chromium on VM101)
      // On Vercel this is ALWAYS forced — Chromium doesn't exist there
      return `${PROD_REMOTE_URL}${path}`;
    }
    // DEV — use local relative paths
    return path;
  }

  /* ───────── Server-Side Batch Polling ───────── */
  /* The batch loop runs on the SERVER (batch-manager singleton).
     The modal just polls GET /batch every 3 seconds to get status. */

  const [activityStatus, setActivityStatus] = useState<string>("idle");

  async function pollBatchStatus() {
    try {
      const res = await fetch(apiUrl("/meo/api/v1/revocred/batch"));
      const data = await res.json();

      const isActive = data.status === "running" || data.status === "waiting";
      setBatchRunning(isActive);
      setActivityStatus(data.status || "idle");
      setBatchCurrentKdi(data.currentKdi || "");
      setBatchCurrentIndex(data.currentOrderIndex ?? -1);
      setBatchCycleCount(data.processedCount || 0);
      if (data.results && Array.isArray(data.results)) setBatchResults(data.results);
      setBatchSteps(
        (data.currentSteps || []).map((s: { step: string; status: string; detail?: string }) => ({
          step: s.step,
          status: s.status as StepStatus,
          detail: s.detail,
        }))
      );
      setActivityOwner(data.startedBy || null);

      if (data.waitRemainingMs !== undefined && data.waitRemainingMs > 0) {
        // Use remaining ms from server to avoid clock skew between Docker and browser
        const clientNextTs = Date.now() + data.waitRemainingMs;
        setBatchNextRunTimestamp(clientNextTs);
        setBatchNextRunAt(
          new Date(clientNextTs).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        );
      } else if (data.nextRunAt) {
        const nextTs = new Date(data.nextRunAt).getTime();
        setBatchNextRunTimestamp(nextTs);
        setBatchNextRunAt(
          new Date(nextTs).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        );
      } else {
        setBatchNextRunAt(null);
        setBatchNextRunTimestamp(null);
      }

      // If running, sync ALL config from server and auto-switch to batch tab
      if (isActive) {
        if (data.batchDate) setBatchDate(data.batchDate);
        if (data.batchStatusFilter) setBatchStatus(data.batchStatusFilter);
        if (data.useCurrentDate !== undefined) setUseCurrentDate(data.useCurrentDate);
        if (data.batchStepDelay) setBatchStepDelay(data.batchStepDelay);
        if (data.batchInterval) setBatchInterval(data.batchInterval);
        setTab("batch");
      }
    } catch {
      // ignore polling errors
    }
  }

  // Poll every 3 seconds when modal is open, or on mount to detect running batch
  useEffect(() => {
    if (!isAdmin) return;
    pollBatchStatus(); // immediate check
    if (!open) return;
    const interval = setInterval(pollBatchStatus, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isAdmin]);

  /* ───────── Reset functions ───────── */

  const resetManual = useCallback(() => {
    setKdi("");
    setSteps([]);
    setRunning(false);
    setResult(null);
    setCompleted(false);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const stopBatch = useCallback(async () => {
    try {
      await fetch(apiUrl("/meo/api/v1/revocred/batch"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      });
    } catch { /* ignore */ }
    setBatchRunning(false);
    setBatchCurrentKdi("");
    setBatchCurrentIndex(-1);
    setBatchNextRunAt(null);
    setBatchNextRunTimestamp(null);
    setActivityStatus("stopped");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(() => {
    resetManual();
    // Don't stop batch — it runs in background
    setOpen(false);
  }, [resetManual]);

  /* ───────── Keyboard ───────── */

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === "x" && !e.shiftKey && !e.altKey) {
        // Only admin can open Ctrl+X
        if (!isAdmin) return;
        e.preventDefault();
        setOpen((prev) => {
          if (prev) {
            resetManual();
            return false;
          }
          // If batch is running or activity is locked, auto-switch to batch tab
          if (batchRunning || batchNextRunAt || batchRunning) {
            setTab("batch");
          }
          return true;
        });
      }
      if (e.key === "Escape" && open) {
        close();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, close, resetManual, batchRunning, batchNextRunAt, isAdmin, batchRunning]);

  useEffect(() => {
    if (open && tab === "manual") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, tab]);

  /* ───────── Manual simulation ───────── */

  function updateSteps(
    setFn: React.Dispatch<React.SetStateAction<SimulationStep[]>>,
    data: SimulationStep
  ) {
    if (data.step === "complete" || data.step === "read_result") return;
    setFn((prev) => {
      const existing = prev.findIndex((s) => s.step === data.step);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = data;
        return updated;
      }
      const withUpdated = prev.map((s) =>
        s.status === "running" ? { ...s, status: "done" as StepStatus } : s
      );
      return [...withUpdated, data];
    });
  }

  /* ───────── Log: check which KDIs have logs ───────── */

  async function checkKdisWithLogs(kdis: string[]) {
    if (kdis.length === 0) return;
    try {
      const res = await fetch(apiUrl(`/meo/api/v1/revocred/log/check?kdis=${encodeURIComponent(kdis.join(","))}`));
      const data = await res.json();
      if (data.kdisWithLogs) {
        setKdisWithLogs((prev) => {
          const next = new Set(prev);
          (data.kdisWithLogs as string[]).forEach((k) => next.add(k));
          return next;
        });
      }
    } catch {
      // Best-effort
    }
  }

  /* ───────── Log: fetch from database ───────── */

  async function fetchLogForKdi(kdiValue: string) {
    if (expandedLogKdi === kdiValue) {
      setExpandedLogKdi(null);
      setExpandedLogData(null);
      return;
    }
    setLoadingLog(true);
    setExpandedLogKdi(kdiValue);
    setExpandedLogData(null);
    try {
      const res = await fetch(apiUrl(`/meo/api/v1/revocred/log?kdi=${encodeURIComponent(kdiValue)}`));
      const data = await res.json();
      if (data.log) {
        setExpandedLogData(data.log as LogRecord);
      }
    } catch {
      setExpandedLogData(null);
    } finally {
      setLoadingLog(false);
    }
  }

  /* ───────── Log: save to database ───────── */

  async function saveLog(logData: Record<string, unknown>) {
    try {
      await fetch(apiUrl("/meo/api/v1/revocred/log"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logData),
      });
      // Mark this KDI as having a log so the button appears immediately
      if (logData.kdi) {
        setKdisWithLogs((prev) => {
          const next = new Set(prev);
          next.add(logData.kdi as string);
          return next;
        });
      }
    } catch {
      // Best-effort — don't break flow
    }
  }

  function runSimulation(
    orderKdi: string,
    delay: number,
    mode: "manual" | "batch" = "manual"
  ): Promise<{ resultado: string; detail: string; parcelas?: unknown[]; stepsLog?: unknown[] }> {
    // Clear batch steps at start of each order
    if (mode === "batch") setBatchSteps([]);

    return new Promise((resolve) => {
      // Route simulate calls: Vercel or PROD → remote server, DEV → local
      const simulateBase = (IS_VERCEL || targetEnv === "prod")
        ? `${PROD_REMOTE_URL}/meo/api/v1/revocred/simulate`
        : (process.env.NEXT_PUBLIC_REVOCRED_WORKER_URL
          ? `${process.env.NEXT_PUBLIC_REVOCRED_WORKER_URL}/meo/api/v1/revocred/simulate`
          : `/meo/api/v1/revocred/simulate`);

      const es = new EventSource(
        `${simulateBase}?kdi=${encodeURIComponent(orderKdi)}&stepDelay=${delay}`
      );

      let finalResult: { resultado: string; detail: string; parcelas?: unknown[]; stepsLog?: unknown[] } = {
        resultado: "INDEFINIDO",
        detail: "",
        parcelas: [],
        stepsLog: [],
      };
      let isDone = false;
      const startTime = Date.now();
      const collectedSteps: { step: string; status: string; detail?: string; timestamp: string }[] = [];

      es.onmessage = (event) => {
        try {
          const data: SimulationStep = JSON.parse(event.data);

          // Collect every step with timestamp for the log
          collectedSteps.push({
            step: data.step,
            status: data.status,
            detail: data.detail,
            timestamp: new Date().toISOString(),
          });

          if (data.step === "complete") {
            isDone = true;
            es.close();
            if (mode === "batch") {
              setBatchSteps((prev) => prev.map((s) => s.status === "running" ? { ...s, status: "done" } : s));
            }
            finalResult.stepsLog = collectedSteps;
            resolve(finalResult);
            return;
          }

          if (data.step === "read_result" && data.status === "done" && data.detail) {
            try {
              const parsed = JSON.parse(data.detail);
              finalResult = {
                resultado: parsed.resultado,
                detail: parsed.motivo || "",
                parcelas: parsed.parcelas || [],
                stepsLog: collectedSteps,
              };
              if (parsed.resultado === "APROVADO" && parsed.parcelas?.length > 0) {
                finalResult.detail = parsed.parcelas
                  .map((p: { prazo: string; valor: string; taxa: string }) => `${p.prazo} de ${p.valor} (${p.taxa})`)
                  .join(", ");
              }
            } catch {
              finalResult = { resultado: "INDEFINIDO", detail: data.detail, parcelas: [], stepsLog: collectedSteps };
            }

            // Set result for manual mode
            if (mode === "manual") {
              try {
                const parsed = JSON.parse(data.detail);
                const isApproved = parsed.resultado === "APROVADO";
                let detail = "";
                if (isApproved && parsed.parcelas?.length > 0) {
                  detail = parsed.parcelas
                    .map((p: { prazo: string; valor: string; taxa: string }) => `${p.prazo} de ${p.valor} (${p.taxa})`)
                    .join("\n");
                } else if (!isApproved) {
                  detail = parsed.motivo || "Crédito não aprovado";
                }
                setResult({ step: isApproved ? "APROVADO" : "REPROVADO", status: "result", detail });
              } catch {
                setResult({ step: "Resultado", status: "result", detail: data.detail });
              }
            }
          }

          if (data.step === "error") {
            isDone = true;
            es.close();
            finalResult = {
              resultado: "ERRO",
              detail: data.detail || "Erro desconhecido",
              parcelas: [],
              stepsLog: collectedSteps,
            };
            resolve(finalResult);
            return;
          }

          // Update steps for the active mode
          updateSteps(mode === "manual" ? setSteps : setBatchSteps, data);
        } catch {
          // ignore
        }
      };

      es.onerror = () => {
        es.close();
        if (!isDone) {
          collectedSteps.push({
            step: "connection_lost",
            status: "error",
            detail: "SSE connection lost",
            timestamp: new Date().toISOString(),
          });
          resolve({
            resultado: "ERRO",
            detail: "Conexão perdida",
            parcelas: [],
            stepsLog: collectedSteps,
          });
        }
      };

      // Store startTime for duration calculation
      (es as unknown as Record<string, number>)._startTime = startTime;

      // Store ref for manual mode only (batch runs server-side)
      if (mode === "manual") {
        eventSourceRef.current = es;
      }
    });
  }

  // Countdown timer for next cycle
  useEffect(() => {
    if (!batchNextRunTimestamp) {
      setBatchCountdown("");
      return;
    }
    const interval = setInterval(() => {
      const remaining = Math.max(0, batchNextRunTimestamp - Date.now());
      if (remaining <= 0) {
        setBatchCountdown("");
        return;
      }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setBatchCountdown(`${mins}m ${secs.toString().padStart(2, "0")}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [batchNextRunTimestamp]);

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = kdi.trim();
    if (!trimmed || running) return;

    setSteps([]);
    setResult(null);
    setCompleted(false);
    setRunning(true);

    const startTime = Date.now();

    runSimulation(trimmed, stepDelay, "manual").then(async (res) => {
      setRunning(false);
      setCompleted(true);
      setSteps((prev) => prev.map((s) => s.status === "running" ? { ...s, status: "done" } : s));
      if (!result && res.resultado === "ERRO") {
        setResult({ step: "Erro", status: "error", detail: res.detail });
      }

      // 1. Normalize resultado: anything NOT APROVADO → REPROVADO
      const normalizedResultado = res.resultado === "APROVADO" ? "APROVADO" : "REPROVADO";
      const statusUpdatedTo =
        normalizedResultado === "APROVADO" ? "analysis_approved" : "analysis_rejected";

      // 2. Update order status (same as batch)
      await updateOrderStatus(trimmed, normalizedResultado);

      // 3. Fetch order info for complete log
      let orderInfo: Record<string, unknown> = {};
      try {
        const infoRes = await fetch(apiUrl(`/meo/api/v1/revocred/order-info?kdi=${encodeURIComponent(trimmed)}`));
        if (infoRes.ok) orderInfo = await infoRes.json();
      } catch { /* ignore */ }

      // 4. Save complete log (same fields as batch)
      saveLog({
        kdi: trimmed,
        customer_name: orderInfo.customerName || null,
        cpf_cnpj: orderInfo.cpfCnpj || null,
        mode: "manual",
        status_before: orderInfo.status || null,
        resultado: normalizedResultado,
        resultado_detail: res.detail || (res.resultado !== "APROVADO" ? `Original: ${res.resultado}` : ""),
        parcelas: res.parcelas || null,
        steps_log: res.stepsLog || null,
        error_message: (res.resultado === "ERRO" || res.resultado === "INDEFINIDO") ? (res.detail || res.resultado) : null,
        duration_ms: Date.now() - startTime,
        status_updated_to: statusUpdatedTo,
        system_power: orderInfo.systemPower || null,
        equipment_value: orderInfo.equipmentValue || null,
        labor_value: orderInfo.laborValue || null,
        monthly_bill_value: orderInfo.monthlyBillValue || null,
      });
    });
  }

  /* ───────── Batch: Fetch orders ───────── */

  async function fetchPendingOrders() {
    setBatchLoading(true);
    setBatchOrders([]);
    setBatchResults([]);
    try {
      const res = await fetch(apiUrl(`/meo/api/v1/revocred/orders-pending?date=${batchDateRef.current}&status=${batchStatusRef.current}`));
      const data = await res.json();
      const orders: PendingOrder[] = data.orders || [];
      setBatchOrders(orders);
      // Check which orders already have logs in the database
      if (orders.length > 0) {
        checkKdisWithLogs(orders.map((o) => o.kdi));
      }
    } catch {
      setBatchOrders([]);
    } finally {
      setBatchLoading(false);
    }
  }

  /* ───────── Batch: Auto-fetch orders when date/status change ───────── */

  useEffect(() => {
    if (!isAdmin || batchRunning) return;
    if (!batchDate) return;
    // Auto-fetch when tab is batch and date/status are set
    if (tab === "batch" && open) {
      fetchPendingOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchDate, batchStatus, tab, open, isAdmin]);

  /* ───────── Batch: Update order status in DB ───────── */

  async function updateOrderStatus(kdi: string, resultado: string) {
    try {
      const res = await fetch(apiUrl("/meo/api/v1/revocred/update-status"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kdi, resultado }),
      });
      if (res.ok) {
        // Invalidate orders queries so all open tabs/users see the update
        queryClient.invalidateQueries({ queryKey: ["orders-paginated"] });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      }
    } catch {
      // Silently ignore — status update is best-effort
    }
  }

  /* ───────── Batch: Start/Stop (server-side via batch API) ───────── */

  async function startBatch() {
    try {
      const res = await fetch(apiUrl("/meo/api/v1/revocred/batch"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          startedBy: currentUserName,
          batchDate: useCurrentDate ? new Date().toISOString().slice(0, 10) : batchDateRef.current,
          batchStatusFilter: batchStatusRef.current,
          batchStepDelay: batchStepDelay,
          batchInterval: batchInterval,
          totalOrders: batchOrders.length,
          useCurrentDate: useCurrentDate,
        }),
      });
      const data = await res.json();

      if (data.locked) {
        alert(data.error || "Já existe uma integração em andamento.");
        return;
      }

      if (data.success) {
        setBatchRunning(true);
        setBatchResults([]);
        setBatchCycleCount(0);
        setActivityStatus("running");
      }
    } catch {
      alert("Erro ao iniciar lote. Verifique a conexão com o servidor.");
    }
  }

  /* ───────── Cleanup ───────── */

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, []);

  // Only admin users can access RevoCred modal
  if (!isAdmin) return null;
  if (!open) return null;

  const isApproved =
    result?.step?.toUpperCase().includes("APROVADO") &&
    !result?.step?.toUpperCase().includes("REPROVADO");

  const visibleSteps = steps.filter((s) => s.step !== "read_result" && s.step !== "complete");

  const batchApproved = batchResults.filter((r) => r.resultado === "APROVADO").length;
  const batchRejected = batchResults.filter((r) => r.resultado !== "APROVADO").length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-800">Simulação RevoCred</h2>
            {batchRunning && batchCurrentKdi && (
              <span className="ml-2 px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 rounded-full animate-pulse">
                PROCESSANDO
              </span>
            )}
            {batchNextRunAt && !batchCurrentKdi && (
              <span className="ml-2 px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded-full">
                AGUARDANDO {batchCountdown}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Environment selector — only visible in DEV (not on Vercel PROD) */}
            {!IS_VERCEL && (
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => !batchRunning && setTargetEnv("dev")}
                  disabled={batchRunning}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
                    targetEnv === "dev"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  } ${batchRunning ? "cursor-not-allowed opacity-60" : ""}`}
                  title="Supabase DEV (uadpzkkj...)"
                >
                  <Database className="w-3 h-3" />
                  DEV
                </button>
                <button
                  onClick={() => !batchRunning && setTargetEnv("prod")}
                  disabled={batchRunning}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
                    targetEnv === "prod"
                      ? "bg-white text-red-600 shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  } ${batchRunning ? "cursor-not-allowed opacity-60" : ""}`}
                  title="Supabase PROD via servidor remoto (meo.cdxsistemas.com.br)"
                >
                  <Server className="w-3 h-3" />
                  PROD
                </button>
              </div>
            )}
            <button onClick={close} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* Environment indicator bar — hidden on Vercel PROD for clean UX */}
        {!IS_VERCEL && targetEnv === "prod" && (
          <div className="px-6 py-1.5 bg-red-50 border-b border-red-100 flex items-center gap-2 text-[11px] text-red-600 flex-shrink-0">
            <Server className="w-3.5 h-3.5" />
            <span className="font-medium">PRODUÇÃO</span>
            <span className="text-red-400">— Conectado via meo.cdxsistemas.com.br (Supabase PROD)</span>
          </div>
        )}
        {!IS_VERCEL && targetEnv === "dev" && (
          <div className="px-6 py-1.5 bg-blue-50 border-b border-blue-100 flex items-center gap-2 text-[11px] text-blue-600 flex-shrink-0">
            <Database className="w-3.5 h-3.5" />
            <span className="font-medium">DESENVOLVIMENTO</span>
            <span className="text-blue-400">— Conectado ao Supabase DEV (local)</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0">
          <button
            onClick={() => setTab("manual")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === "manual" ? "text-green-600 border-b-2 border-green-600" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Simulação Manual
          </button>
          <button
            onClick={() => setTab("batch")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${
              tab === "batch" ? "text-green-600 border-b-2 border-green-600" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Lote Automático
            {batchRunning && (
              <span className="absolute top-1.5 right-4 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
            )}
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {/* ═══════════ MANUAL TAB ═══════════ */}
          {tab === "manual" && (
            <>
              {/* Input Form */}
              <form onSubmit={handleManualSubmit} className="flex gap-2 mb-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={kdi}
                  onChange={(e) => setKdi(e.target.value)}
                  placeholder="Número do Pedido (KDI)"
                  disabled={running}
                  className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  disabled={running || !kdi.trim()}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Simular
                </button>
              </form>

              {/* Step delay config */}
              <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
                <Timer className="w-3.5 h-3.5" />
                <span>Delay entre etapas:</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={stepDelay}
                  onChange={(e) => setStepDelay(Math.max(1, Math.min(10, Number(e.target.value))))}
                  disabled={running}
                  className="w-14 px-2 py-1 text-xs border border-gray-200 rounded text-center disabled:opacity-50"
                />
                <span>seg</span>
              </div>

              {/* Steps */}
              {visibleSteps.length > 0 && (
                <div className="space-y-3 mb-4">
                  {visibleSteps.map((s, i) => {
                    const Icon = getStepIcon(s.step);
                    const isStepRunning = s.status === "running";
                    const isDone = s.status === "done";
                    const isError = s.status === "error";
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          isDone ? "bg-green-50 text-green-600" : isError ? "bg-red-50 text-red-500" : isStepRunning ? "bg-blue-50 text-blue-500" : "bg-gray-50 text-gray-400"
                        }`}>
                          {isStepRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${isDone ? "text-gray-600" : isError ? "text-red-600" : isStepRunning ? "text-gray-800 font-medium" : "text-gray-400"}`}>{s.step}</p>
                          {s.detail && <p className="text-xs text-gray-400 mt-0.5 truncate">{s.detail}</p>}
                        </div>
                        <div className="flex-shrink-0">
                          {isStepRunning && (
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
                            </span>
                          )}
                          {isDone && <CheckCircle className="w-4 h-4 text-green-500" />}
                          {isError && <X className="w-4 h-4 text-red-500" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Result */}
              {result && result.status === "result" && (
                <div className={`mt-4 p-5 rounded-xl border-2 ${isApproved ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isApproved ? "bg-green-100" : "bg-red-100"}`}>
                      {isApproved ? <CheckCircle className="w-6 h-6 text-green-600" /> : <X className="w-6 h-6 text-red-600" />}
                    </div>
                    <span className={`text-xl font-bold ${isApproved ? "text-green-700" : "text-red-700"}`}>{result.step}</span>
                  </div>
                  {result.detail && <p className={`text-sm mt-2 whitespace-pre-line ${isApproved ? "text-green-700" : "text-red-700"}`}>{result.detail}</p>}
                </div>
              )}
              {result && result.status === "error" && (
                <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200">
                  <div className="flex items-center gap-2">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700">{result.detail}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══════════ BATCH TAB ═══════════ */}
          {tab === "batch" && (
            <>
              {/* Config section */}
              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Settings2 className="w-4 h-4" />
                  Configurações
                </div>

                {/* Date picker */}
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <label className="text-sm text-gray-600 w-32">Data dos pedidos:</label>
                  <input
                    type="date"
                    value={batchDate}
                    onChange={(e) => { setBatchDate(e.target.value); setUseCurrentDate(false); setBatchResults([]); }}
                    disabled={batchRunning || useCurrentDate}
                    className={`px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 ${useCurrentDate ? "bg-green-50 border-green-200" : ""}`}
                  />
                  <label
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border cursor-pointer select-none transition-all ${
                      useCurrentDate
                        ? "bg-green-50 border-green-300 text-green-700"
                        : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                    } ${batchRunning ? "opacity-50 cursor-not-allowed" : ""}`}
                    title="Sempre usa a data de hoje. Ao virar o dia, captura automaticamente os pedidos do novo dia."
                  >
                    <input
                      type="checkbox"
                      checked={useCurrentDate}
                      onChange={(e) => {
                        if (batchRunning) return;
                        setUseCurrentDate(e.target.checked);
                        if (e.target.checked) {
                          setBatchDate(new Date().toISOString().slice(0, 10));
                        }
                      }}
                      disabled={batchRunning}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-green-600 focus:ring-green-500 accent-green-600"
                    />
                    Hoje
                  </label>
                  {batchLoading && (
                    <Loader2 className="w-4 h-4 animate-spin text-green-500" />
                  )}
                </div>

                {/* Status filter */}
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <label className="text-sm text-gray-600 w-32">Status:</label>
                  <select
                    value={batchStatus}
                    onChange={(e) => { setBatchStatus(e.target.value); setBatchResults([]); }}
                    disabled={batchRunning}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 bg-white"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Step delay */}
                <div className="flex items-center gap-3">
                  <Timer className="w-4 h-4 text-gray-400" />
                  <label className="text-sm text-gray-600 w-32">Delay entre etapas:</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={batchStepDelay}
                    onChange={(e) => setBatchStepDelay(Math.max(1, Math.min(10, Number(e.target.value))))}
                    disabled={batchRunning}
                    className="w-16 px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-center disabled:opacity-50"
                  />
                  <span className="text-sm text-gray-400">segundos</span>
                </div>

                {/* Interval between orders */}
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-gray-400" />
                  <label className="text-sm text-gray-600 w-32">Intervalo pedidos:</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={batchInterval}
                    onChange={(e) => setBatchInterval(Math.max(1, Math.min(120, Number(e.target.value))))}
                    disabled={batchRunning}
                    className="w-16 px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-center disabled:opacity-50"
                  />
                  <span className="text-sm text-gray-400">min entre cada pedido</span>
                </div>
              </div>

              {/* Activity stopped — show reset button */}
              {!batchRunning && activityStatus === "stopped" && (
                <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Square className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Última integração finalizada</span>
                      {activityOwner && (
                        <span className="text-xs text-gray-400">(por {activityOwner})</span>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await fetch(apiUrl("/meo/api/v1/revocred/batch"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: "reset" }),
                          });
                        } catch { /* ignore */ }
                        setActivityStatus("idle");
                        setBatchResults([]);
                        setBatchCycleCount(0);
                        setBatchCurrentKdi("");
                        setBatchNextRunAt(null);
                        setBatchNextRunTimestamp(null);
                      }}
                      className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Nova Integração
                    </button>
                  </div>
                  {batchCycleCount > 0 && (
                    <p className="text-xs text-gray-400 mt-1">Processados na última execução: {batchCycleCount}</p>
                  )}
                </div>
              )}

              {/* Batch running but no local orders (admin re-entered) — show stop button */}
              {batchRunning && batchOrders.length === 0 && (
                <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      <Server className="w-4 h-4 animate-pulse" />
                      <div>
                        <span className="font-medium">Integração em andamento</span>
                        {activityOwner && (
                          <span className="text-xs text-blue-500 ml-1">(por {activityOwner})</span>
                        )}
                        {batchCycleCount > 0 && (
                          <span className="text-xs text-blue-500 ml-2">— {batchCycleCount} processado{batchCycleCount !== 1 ? "s" : ""}</span>
                        )}
                        {batchCurrentKdi && (
                          <span className="text-xs text-blue-400 ml-2">| Atual: {batchCurrentKdi}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={stopBatch}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Square className="w-3.5 h-3.5" />
                      Parar
                    </button>
                  </div>
                  {batchNextRunAt && (
                    <p className="text-xs text-blue-400 mt-1">Próximo ciclo: {batchNextRunAt}</p>
                  )}
                  {/* Show results if any */}
                  {batchResults.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-blue-200 space-y-0.5">
                      <p className="text-xs font-medium text-blue-600 mb-1">Resultados:</p>
                      {batchResults.map((r) => (
                        <div key={r.kdi} className="flex items-center gap-2 text-xs text-blue-600">
                          <span className="font-mono">{r.kdi}</span>
                          <span className="truncate flex-1">{r.customerName}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            r.resultado === "APROVADO" ? "bg-green-100 text-green-700" :
                            r.resultado === "REPROVADO" ? "bg-red-100 text-red-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>{r.resultado}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Orders found */}
              {batchOrders.length > 0 && (
                <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {batchOrders.length} pedido{batchOrders.length !== 1 ? "s" : ""} — {ORDER_STATUSES.find((s) => s.value === batchStatus)?.label || batchStatus}
                      {batchRunning && batchCycleCount > 0 && (
                        <span className="text-xs text-gray-400 ml-1">
                          ({batchCycleCount} processado{batchCycleCount !== 1 ? "s" : ""}, lista atualizada a cada ciclo)
                        </span>
                      )}
                    </span>
                    {!batchRunning && (
                      <button
                        onClick={startBatch}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Iniciar Lote
                      </button>
                    )}
                    {batchRunning && (
                      <button
                        onClick={stopBatch}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <Square className="w-3.5 h-3.5" />
                        Parar
                      </button>
                    )}
                  </div>

                  {/* Order list */}
                  <div className="max-h-48 overflow-y-auto space-y-0.5">
                    {batchOrders.map((o, i) => {
                      const res = batchResults.find((r) => r.kdi === o.kdi);
                      const isCurrent = batchCurrentKdi === o.kdi;
                      const isExpanded = expandedLogKdi === o.kdi;
                      return (
                        <React.Fragment key={o.kdi}>
                          <div
                            className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
                              isCurrent ? "bg-blue-50 text-blue-700 font-medium" : res ? "text-gray-500" : "text-gray-600"
                            }`}
                          >
                            <span className="w-5 text-center text-gray-400">{i + 1}</span>
                            <span className="font-mono">{o.kdi}</span>
                            <span className="flex-1 truncate">{o.customerName}</span>
                            {/* Log button — show when order has a log in DB or was processed this session */}
                            {(res || kdisWithLogs.has(o.kdi)) && (
                              <button
                                onClick={() => fetchLogForKdi(o.kdi)}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-medium bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors flex-shrink-0"
                                title="Log de integração RevoCred"
                              >
                                <FileText className="w-3 h-3" />
                                {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                              </button>
                            )}
                            {isCurrent && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500 flex-shrink-0" />}
                            {res?.resultado === "APROVADO" && <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                            {res?.resultado === "REPROVADO" && <X className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                            {(res?.resultado === "ERRO" || res?.resultado === "INDEFINIDO") && <X className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />}
                          </div>
                          {/* Expanded log panel inline */}
                          {isExpanded && (
                            <div className="ml-7 mr-1 mb-1 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                              {loadingLog && (
                                <div className="flex items-center gap-2 text-xs text-orange-600">
                                  <Loader2 className="w-3 h-3 animate-spin" /> Carregando log...
                                </div>
                              )}
                              {!loadingLog && !expandedLogData && (
                                <p className="text-xs text-gray-400">Nenhum log encontrado para este pedido.</p>
                              )}
                              {!loadingLog && expandedLogData && (
                                <div className="space-y-2">
                                  {/* Header info */}
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                                    <div><span className="text-gray-400">Data:</span> <span className="text-gray-700">{new Date(expandedLogData.created_at).toLocaleString("pt-BR")}</span></div>
                                    <div><span className="text-gray-400">Modo:</span> <span className="text-gray-700 capitalize">{expandedLogData.mode}</span></div>
                                    <div><span className="text-gray-400">CPF/CNPJ:</span> <span className="text-gray-700">{expandedLogData.cpf_cnpj || "—"}</span></div>
                                    <div><span className="text-gray-400">Duração:</span> <span className="text-gray-700">{expandedLogData.duration_ms ? `${(expandedLogData.duration_ms / 1000).toFixed(1)}s` : "—"}</span></div>
                                    <div><span className="text-gray-400">Potência:</span> <span className="text-gray-700">{expandedLogData.system_power ? `${expandedLogData.system_power} kWp` : "—"}</span></div>
                                    <div><span className="text-gray-400">Equipamentos:</span> <span className="text-gray-700">{expandedLogData.equipment_value ? `R$ ${Number(expandedLogData.equipment_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</span></div>
                                    <div><span className="text-gray-400">Mão de obra:</span> <span className="text-gray-700">{expandedLogData.labor_value ? `R$ ${Number(expandedLogData.labor_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</span></div>
                                    <div><span className="text-gray-400">Conta luz:</span> <span className="text-gray-700">{expandedLogData.monthly_bill_value ? `R$ ${Number(expandedLogData.monthly_bill_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</span></div>
                                    {expandedLogData.status_before && (
                                      <div><span className="text-gray-400">Status anterior:</span> <span className="text-gray-700">{ORDER_STATUSES.find((s) => s.value === expandedLogData.status_before)?.label || expandedLogData.status_before}</span></div>
                                    )}
                                    {expandedLogData.status_updated_to && (
                                      <div><span className="text-gray-400">Status atualizado:</span> <span className="text-green-700 font-medium">{ORDER_STATUSES.find((s) => s.value === expandedLogData.status_updated_to)?.label || expandedLogData.status_updated_to}</span></div>
                                    )}
                                  </div>

                                  {/* Parcelas */}
                                  {expandedLogData.parcelas && expandedLogData.parcelas.length > 0 && (
                                    <div>
                                      <p className="text-[10px] text-orange-600 font-medium mb-1">Financiamento:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {expandedLogData.parcelas.map((p, pi) => (
                                          <span key={pi} className="px-2 py-0.5 bg-white border border-orange-200 rounded text-[10px] text-gray-700">
                                            {p.prazo} de {p.valor} {p.taxa && `(${p.taxa})`}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Detail text */}
                                  {expandedLogData.resultado_detail && (
                                    <div>
                                      <p className="text-[10px] text-orange-600 font-medium mb-0.5">Detalhe retornado:</p>
                                      <p className="text-[11px] text-gray-600 bg-white p-2 rounded border border-orange-100">{expandedLogData.resultado_detail}</p>
                                    </div>
                                  )}

                                  {/* Error */}
                                  {expandedLogData.error_message && (
                                    <div>
                                      <p className="text-[10px] text-red-600 font-medium mb-0.5">Erro:</p>
                                      <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded border border-red-100">{expandedLogData.error_message}</p>
                                    </div>
                                  )}

                                  {/* Steps timeline */}
                                  {expandedLogData.steps_log && expandedLogData.steps_log.length > 0 && (
                                    <div>
                                      <p className="text-[10px] text-orange-600 font-medium mb-1">Etapas da automação:</p>
                                      <div className="space-y-0.5 bg-white p-2 rounded border border-orange-100">
                                        {expandedLogData.steps_log.map((s, si) => (
                                          <div key={si} className="flex items-center gap-2 text-[10px]">
                                            <span className="text-gray-300 font-mono w-16 flex-shrink-0">
                                              {new Date(s.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                            </span>
                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                              s.status === "done" ? "bg-green-400" : s.status === "error" ? "bg-red-400" : s.status === "running" ? "bg-blue-400" : "bg-gray-300"
                                            }`} />
                                            <span className="text-gray-600 font-medium">{s.step}</span>
                                            {s.detail && <span className="text-gray-400 truncate ml-auto max-w-[200px]">{s.detail}</span>}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}

              {batchOrders.length === 0 && !batchLoading && !batchRunning && (
                <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      Nenhum pedido encontrado para a data e status selecionados
                    </span>
                    <button
                      onClick={startBatch}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                      title="Inicia a rotina mesmo sem pedidos — ficará aguardando novos pedidos aparecerem"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Iniciar Rotina
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    A rotina pode ser iniciada mesmo sem pedidos — ficará aguardando e verificando a cada ciclo.
                  </p>
                </div>
              )}

              {/* Batch progress with live steps */}
              {batchRunning && batchCurrentKdi && (
                <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 text-sm text-blue-700 mb-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="font-medium">
                      Pedido {batchCurrentIndex + 1}/{batchOrders.length}
                      <span className="font-mono ml-1">({batchCurrentKdi})</span>
                    </span>
                    {batchCycleCount > 0 && (
                      <span className="ml-auto text-xs text-blue-400">Processados: {batchCycleCount}</span>
                    )}
                  </div>
                  {/* Live steps */}
                  {batchSteps.filter((s) => s.step !== "read_result" && s.step !== "complete").length > 0 && (
                    <div className="space-y-1.5 ml-1">
                      {batchSteps.filter((s) => s.step !== "read_result" && s.step !== "complete").map((s, i) => {
                        const Icon = getStepIcon(s.step);
                        const isStepRunning = s.status === "running";
                        const isDone = s.status === "done";
                        const isError = s.status === "error";
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                              isDone ? "bg-green-100 text-green-600" : isError ? "bg-red-100 text-red-500" : isStepRunning ? "bg-blue-100 text-blue-500" : "bg-gray-100 text-gray-400"
                            }`}>
                              {isStepRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
                            </div>
                            <span className={`text-xs ${isDone ? "text-gray-500" : isError ? "text-red-600" : isStepRunning ? "text-blue-700 font-medium" : "text-gray-400"}`}>
                              {s.step}
                            </span>
                            {s.detail && <span className="text-[10px] text-gray-400 truncate ml-auto max-w-[200px]">{s.detail}</span>}
                            <div className="flex-shrink-0 ml-auto">
                              {isDone && <CheckCircle className="w-3 h-3 text-green-500" />}
                              {isError && <X className="w-3 h-3 text-red-500" />}
                              {isStepRunning && (
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Waiting for next cycle */}
              {batchNextRunAt && !batchCurrentKdi && (
                <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-2 text-sm text-amber-700">
                    <RefreshCw className="w-4 h-4" />
                    <span>Aguardando próximo ciclo às {batchNextRunAt} (recarrega novos pedidos)</span>
                    {batchCountdown && (
                      <span className="ml-auto font-mono text-xs bg-amber-100 px-2 py-0.5 rounded">
                        {batchCountdown}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-amber-500 mt-1">
                    Intervalo: {batchInterval} min &middot; Pedidos processados: {batchCycleCount}
                  </p>
                </div>
              )}

              {/* Batch results summary */}
              {batchResults.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium text-gray-700">Resultados:</span>
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-3.5 h-3.5" /> {batchApproved} aprovado{batchApproved !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <X className="w-3.5 h-3.5" /> {batchRejected} reprovado{batchRejected !== 1 ? "s" : ""}
                    </span>
                    {/* All results are normalized: APROVADO or REPROVADO */}
                  </div>

                  {/* Results table */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500">
                          <th className="px-3 py-2 text-left font-medium">KDI</th>
                          <th className="px-3 py-2 text-left font-medium">Cliente</th>
                          <th className="px-3 py-2 text-center font-medium">Resultado</th>
                          <th className="px-3 py-2 text-center font-medium">Status</th>
                          <th className="px-3 py-2 text-center font-medium">Log</th>
                          <th className="px-3 py-2 text-left font-medium">Detalhe</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchResults.map((r) => (
                          <React.Fragment key={r.kdi}>
                            <tr className="border-t border-gray-100">
                              <td className="px-3 py-2 font-mono">{r.kdi}</td>
                              <td className="px-3 py-2 truncate max-w-[120px]">{r.customerName}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  r.resultado === "APROVADO" ? "bg-green-100 text-green-700" :
                                  r.resultado === "REPROVADO" ? "bg-red-100 text-red-700" :
                                  "bg-orange-100 text-orange-700"
                                }`}>
                                  {r.resultado}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center">
                                {(r.resultado === "APROVADO" || r.resultado === "REPROVADO") ? (
                                  <span className="text-[10px] text-green-600 font-medium flex items-center justify-center gap-0.5">
                                    <CheckCircle className="w-3 h-3" /> Atualizado
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  onClick={() => fetchLogForKdi(r.kdi)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                                  title="Ver log de automação"
                                >
                                  <FileText className="w-3 h-3" />
                                  {expandedLogKdi === r.kdi ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              </td>
                              <td className="px-3 py-2 text-gray-500 truncate max-w-[180px]">{r.detail}</td>
                            </tr>
                            {/* Expanded log detail */}
                            {expandedLogKdi === r.kdi && (
                              <tr>
                                <td colSpan={6} className="p-0">
                                  <div className="bg-orange-50 border-t border-orange-100 px-4 py-3">
                                    {loadingLog && (
                                      <div className="flex items-center gap-2 text-xs text-orange-600">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Carregando log...
                                      </div>
                                    )}
                                    {!loadingLog && !expandedLogData && (
                                      <p className="text-xs text-gray-400">Nenhum log encontrado para este pedido.</p>
                                    )}
                                    {!loadingLog && expandedLogData && (
                                      <div className="space-y-2">
                                        {/* Header info */}
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                                          <div><span className="text-gray-400">Data:</span> <span className="text-gray-700">{new Date(expandedLogData.created_at).toLocaleString("pt-BR")}</span></div>
                                          <div><span className="text-gray-400">Modo:</span> <span className="text-gray-700 capitalize">{expandedLogData.mode}</span></div>
                                          <div><span className="text-gray-400">CPF/CNPJ:</span> <span className="text-gray-700">{expandedLogData.cpf_cnpj || "—"}</span></div>
                                          <div><span className="text-gray-400">Duração:</span> <span className="text-gray-700">{expandedLogData.duration_ms ? `${(expandedLogData.duration_ms / 1000).toFixed(1)}s` : "—"}</span></div>
                                          <div><span className="text-gray-400">Potência:</span> <span className="text-gray-700">{expandedLogData.system_power ? `${expandedLogData.system_power} kWp` : "—"}</span></div>
                                          <div><span className="text-gray-400">Equipamentos:</span> <span className="text-gray-700">{expandedLogData.equipment_value ? `R$ ${Number(expandedLogData.equipment_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</span></div>
                                          <div><span className="text-gray-400">Mão de obra:</span> <span className="text-gray-700">{expandedLogData.labor_value ? `R$ ${Number(expandedLogData.labor_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</span></div>
                                          <div><span className="text-gray-400">Conta luz:</span> <span className="text-gray-700">{expandedLogData.monthly_bill_value ? `R$ ${Number(expandedLogData.monthly_bill_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</span></div>
                                          {expandedLogData.status_before && (
                                            <div><span className="text-gray-400">Status anterior:</span> <span className="text-gray-700">{ORDER_STATUSES.find((s) => s.value === expandedLogData.status_before)?.label || expandedLogData.status_before}</span></div>
                                          )}
                                          {expandedLogData.status_updated_to && (
                                            <div><span className="text-gray-400">Status atualizado:</span> <span className="text-green-700 font-medium">{ORDER_STATUSES.find((s) => s.value === expandedLogData.status_updated_to)?.label || expandedLogData.status_updated_to}</span></div>
                                          )}
                                        </div>

                                        {/* Parcelas */}
                                        {expandedLogData.parcelas && expandedLogData.parcelas.length > 0 && (
                                          <div>
                                            <p className="text-[10px] text-orange-600 font-medium mb-1">Financiamento:</p>
                                            <div className="flex flex-wrap gap-1">
                                              {expandedLogData.parcelas.map((p, pi) => (
                                                <span key={pi} className="px-2 py-0.5 bg-white border border-orange-200 rounded text-[10px] text-gray-700">
                                                  {p.prazo} de {p.valor} {p.taxa && `(${p.taxa})`}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Detail text */}
                                        {expandedLogData.resultado_detail && (
                                          <div>
                                            <p className="text-[10px] text-orange-600 font-medium mb-0.5">Detalhe retornado:</p>
                                            <p className="text-[11px] text-gray-600 bg-white p-2 rounded border border-orange-100">{expandedLogData.resultado_detail}</p>
                                          </div>
                                        )}

                                        {/* Error */}
                                        {expandedLogData.error_message && (
                                          <div>
                                            <p className="text-[10px] text-red-600 font-medium mb-0.5">Erro:</p>
                                            <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded border border-red-100">{expandedLogData.error_message}</p>
                                          </div>
                                        )}

                                        {/* Steps timeline */}
                                        {expandedLogData.steps_log && expandedLogData.steps_log.length > 0 && (
                                          <div>
                                            <p className="text-[10px] text-orange-600 font-medium mb-1">Etapas da automação:</p>
                                            <div className="space-y-0.5 bg-white p-2 rounded border border-orange-100">
                                              {expandedLogData.steps_log.map((s, si) => (
                                                <div key={si} className="flex items-center gap-2 text-[10px]">
                                                  <span className="text-gray-300 font-mono w-16 flex-shrink-0">
                                                    {new Date(s.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                                  </span>
                                                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                                    s.status === "done" ? "bg-green-400" : s.status === "error" ? "bg-red-400" : s.status === "running" ? "bg-blue-400" : "bg-gray-300"
                                                  }`} />
                                                  <span className="text-gray-600 font-medium">{s.step}</span>
                                                  {s.detail && <span className="text-gray-400 truncate ml-auto max-w-[200px]">{s.detail}</span>}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex-shrink-0">
          <p className="text-xs text-gray-400 text-center">
            <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-500 font-mono text-[10px]">Ctrl+X</kbd> abrir/fechar
            &nbsp;&middot;&nbsp;
            <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-500 font-mono text-[10px]">Esc</kbd> fechar (lote continua em background)
          </p>
        </div>
      </div>
    </div>
  );
}
