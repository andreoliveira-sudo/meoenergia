"use client"

import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { createContext, useCallback, useContext, useRef, useState } from "react"

import { Button } from "@/components/ui/button"

// ─── Types ───────────────────────────────────────────────────────────

type FeedbackState = "idle" | "loading" | "success" | "error"

interface ExecuteOptions<T = any> {
	action: () => Promise<T>
	loadingMessage?: string
	successMessage?: string | ((result: T) => string)
	errorMessage?: string | ((error: Error) => string)
	onSuccess?: (result: T) => void
	onError?: (error: Error) => void
	/** Duração em ms para auto-fechar no sucesso (padrão: 2500) */
	autoCloseDuration?: number
}

interface ShowErrorOptions {
	title?: string
	message: string
	/** Se definido, auto-fecha após essa duração (ms) */
	autoCloseDuration?: number
}

interface OperationFeedbackContextType {
	execute: <T = any>(options: ExecuteOptions<T>) => Promise<void>
	showError: (options: ShowErrorOptions) => void
}

// ─── Context ─────────────────────────────────────────────────────────

const OperationFeedbackContext = createContext<OperationFeedbackContextType | null>(null)

// ─── Animated SVG Components ─────────────────────────────────────────

function AnimatedCheckmark() {
	return (
		<motion.div
			initial={{ scale: 0 }}
			animate={{ scale: 1 }}
			transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
			className="relative"
		>
			{/* Círculo de fundo com pulse */}
			<motion.div
				className="absolute inset-0 rounded-full bg-emerald-400/20"
				initial={{ scale: 1 }}
				animate={{ scale: [1, 1.4, 1] }}
				transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
			/>
			<div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
				<svg viewBox="0 0 24 24" fill="none" className="h-10 w-10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
					<motion.path
						d="M5 13l4 4L19 7"
						initial={{ pathLength: 0, opacity: 0 }}
						animate={{ pathLength: 1, opacity: 1 }}
						transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
					/>
				</svg>
			</div>
		</motion.div>
	)
}

function AnimatedErrorIcon() {
	return (
		<motion.div
			initial={{ scale: 0, rotate: -180 }}
			animate={{ scale: 1, rotate: 0 }}
			transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
		>
			<motion.div
				animate={{ x: [0, -4, 4, -4, 4, 0] }}
				transition={{ duration: 0.5, delay: 0.3 }}
				className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-lg shadow-red-500/30"
			>
				<svg viewBox="0 0 24 24" fill="none" className="h-10 w-10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
					<motion.path d="M18 6L6 18" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.2 }} />
					<motion.path d="M6 6l12 12" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.35 }} />
				</svg>
			</motion.div>
		</motion.div>
	)
}

function LoadingSpinner() {
	return (
		<motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
			<div className="relative flex h-20 w-20 items-center justify-center">
				{/* Spinner ring */}
				<motion.div
					className="absolute inset-0 rounded-full border-4 border-transparent"
					style={{
						borderTopColor: "#0693E3",
						borderRightColor: "#3AAFE5"
					}}
					animate={{ rotate: 360 }}
					transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
				/>
				{/* Inner glow */}
				<motion.div
					className="h-12 w-12 rounded-full bg-gradient-to-br from-[#0693E3]/10 to-[#3AAFE5]/10"
					animate={{ scale: [1, 1.1, 1] }}
					transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
				/>
			</div>
		</motion.div>
	)
}

function ProgressBar({ duration }: { duration: number }) {
	return (
		<div className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-gray-200">
			<motion.div
				className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
				initial={{ width: "100%" }}
				animate={{ width: "0%" }}
				transition={{ duration: duration / 1000, ease: "linear" }}
			/>
		</div>
	)
}

// ─── Modal Component ─────────────────────────────────────────────────

function FeedbackModal({
	state,
	message,
	detailMessage,
	autoCloseDuration,
	onClose,
	customErrorTitle,
	isAutoClosingError
}: {
	state: FeedbackState
	message: string
	detailMessage: string
	autoCloseDuration: number
	onClose: () => void
	customErrorTitle?: string | null
	isAutoClosingError?: boolean
}) {
	if (state === "idle") return null

	return (
		<AnimatePresence>
			{(state === "loading" || state === "success" || state === "error") && (
				<motion.div
					key="feedback-overlay"
					className="fixed inset-0 z-[100] flex items-center justify-center"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.2 }}
				>
					{/* Backdrop */}
					<motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={state === "error" ? onClose : undefined} />

					{/* Card */}
					<motion.div
						className="relative z-10 flex min-w-[320px] max-w-[420px] flex-col items-center rounded-2xl bg-white px-8 py-10 shadow-2xl"
						initial={{ scale: 0.8, opacity: 0, y: 20 }}
						animate={{ scale: 1, opacity: 1, y: 0 }}
						exit={{ scale: 0.8, opacity: 0, y: 20 }}
						transition={{ type: "spring", stiffness: 300, damping: 25 }}
					>
						{/* Icon Area */}
						<AnimatePresence mode="wait">
							{state === "loading" && (
								<motion.div key="loading" exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
									<LoadingSpinner />
								</motion.div>
							)}
							{state === "success" && (
								<motion.div key="success">
									<AnimatedCheckmark />
								</motion.div>
							)}
							{state === "error" && (
								<motion.div key="error">
									<AnimatedErrorIcon />
								</motion.div>
							)}
						</AnimatePresence>

						{/* Title */}
						<motion.h3
							className={`mt-6 text-center text-lg font-semibold ${
								state === "success" ? "text-emerald-700" : state === "error" ? "text-red-700" : "text-gray-700"
							}`}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: state === "loading" ? 0 : 0.3 }}
						>
							{state === "loading" && message}
							{state === "success" && "Operação realizada com sucesso!"}
							{state === "error" && (customErrorTitle || "Ops! Algo deu errado")}
						</motion.h3>

						{/* Detail message */}
						{(state === "success" || state === "error") && detailMessage && (
							<motion.p
								className="mt-2 max-w-[300px] text-center text-sm text-gray-500"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.4 }}
							>
								{detailMessage}
							</motion.p>
						)}

						{/* Progress bar (success auto-close) */}
						{state === "success" && (
							<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
								<ProgressBar duration={autoCloseDuration} />
							</motion.div>
						)}

						{/* Close button (error only) */}
						{state === "error" && (
							<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
								<Button variant="outline" className="mt-6 gap-2" onClick={onClose}>
									<X className="h-4 w-4" />
									Fechar
								</Button>
							</motion.div>
						)}

						{/* Progress bar (error auto-close) */}
						{state === "error" && isAutoClosingError && (
							<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
								<ProgressBar duration={autoCloseDuration} />
							</motion.div>
						)}
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}

// ─── Provider ────────────────────────────────────────────────────────

function OperationFeedbackProvider({ children }: { children: React.ReactNode }) {
	const [state, setState] = useState<FeedbackState>("idle")
	const [message, setMessage] = useState("")
	const [detailMessage, setDetailMessage] = useState("")
	const [autoCloseDuration, setAutoCloseDuration] = useState(2500)
	const [customErrorTitle, setCustomErrorTitle] = useState<string | null>(null)
	const [isAutoClosingError, setIsAutoClosingError] = useState(false)
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const close = useCallback(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current)
			timerRef.current = null
		}
		setState("idle")
		setMessage("")
		setDetailMessage("")
		setCustomErrorTitle(null)
		setIsAutoClosingError(false)
	}, [])

	const execute = useCallback(
		async <T,>(options: ExecuteOptions<T>) => {
			const { action, loadingMessage = "Processando...", successMessage, errorMessage, onSuccess, onError, autoCloseDuration: duration = 2500 } = options

			// Limpa timer anterior e estados de showError
			if (timerRef.current) {
				clearTimeout(timerRef.current)
				timerRef.current = null
			}
			setCustomErrorTitle(null)
			setIsAutoClosingError(false)

			// Estado loading
			setAutoCloseDuration(duration)
			setMessage(loadingMessage)
			setDetailMessage("")
			setState("loading")

			try {
				const result = await action()

				// Verifica se o resultado segue o padrão ActionResponse
				const actionResult = result as any
				if (actionResult && typeof actionResult === "object" && "success" in actionResult) {
					if (actionResult.success) {
						// Sucesso
						const successMsg =
							typeof successMessage === "function" ? successMessage(result) : successMessage || actionResult.message || "Concluído com sucesso!"
						setDetailMessage(successMsg)
						setState("success")

						// Executa callback onSuccess
						onSuccess?.(result)

						// Auto-close
						timerRef.current = setTimeout(close, duration)
					} else {
						// Erro retornado pelo servidor (success: false)
						const errMsg = typeof errorMessage === "function" ? errorMessage(new Error(actionResult.message)) : errorMessage || actionResult.message || "Erro desconhecido"
						setDetailMessage(errMsg)
						setState("error")
						onError?.(new Error(actionResult.message))
					}
				} else {
					// Resultado sem padrão ActionResponse - trata como sucesso
					const successMsg = typeof successMessage === "function" ? successMessage(result) : successMessage || "Concluído com sucesso!"
					setDetailMessage(successMsg)
					setState("success")
					onSuccess?.(result)
					timerRef.current = setTimeout(close, duration)
				}
			} catch (error) {
				// Exceção inesperada
				const err = error instanceof Error ? error : new Error("Erro desconhecido")
				const errMsg = typeof errorMessage === "function" ? errorMessage(err) : errorMessage || err.message || "Ocorreu um erro inesperado"
				setDetailMessage(errMsg)
				setState("error")
				onError?.(err)
			}
		},
		[close]
	)

	const showError = useCallback(
		(options: ShowErrorOptions) => {
			if (timerRef.current) {
				clearTimeout(timerRef.current)
				timerRef.current = null
			}
			setCustomErrorTitle(options.title || null)
			setDetailMessage(options.message)
			setIsAutoClosingError(!!options.autoCloseDuration)
			if (options.autoCloseDuration) {
				setAutoCloseDuration(options.autoCloseDuration)
			}
			setState("error")
			if (options.autoCloseDuration) {
				timerRef.current = setTimeout(close, options.autoCloseDuration)
			}
		},
		[close]
	)

	return (
		<OperationFeedbackContext.Provider value={{ execute, showError }}>
			{children}
			<FeedbackModal
				state={state}
				message={message}
				detailMessage={detailMessage}
				autoCloseDuration={autoCloseDuration}
				onClose={close}
				customErrorTitle={customErrorTitle}
				isAutoClosingError={isAutoClosingError}
			/>
		</OperationFeedbackContext.Provider>
	)
}

// ─── Hook ────────────────────────────────────────────────────────────

function useOperationFeedback() {
	const context = useContext(OperationFeedbackContext)
	if (!context) {
		throw new Error("useOperationFeedback deve ser usado dentro de OperationFeedbackProvider")
	}
	return context
}

export { OperationFeedbackProvider, useOperationFeedback }
