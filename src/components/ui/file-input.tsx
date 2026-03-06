"use client"

import { File as FileIcon, Upload, X } from "lucide-react"
import * as React from "react"
import { type DropzoneOptions, useDropzone } from "react-dropzone"

import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Input } from "./input"

interface FileInputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
	value?: FileList
	onChange?: (files: FileList | undefined) => void
	onRemove?: () => void
	dropzoneOptions?: DropzoneOptions
}

const FileInput = React.forwardRef<HTMLDivElement, FileInputProps>(({ value, onChange, onRemove, dropzoneOptions, className, ...props }, ref) => {
	const file = value?.[0]

	const onDrop = React.useCallback(
		(acceptedFiles: File[]) => {
			const dataTransfer = new DataTransfer()
			acceptedFiles.forEach((file) => dataTransfer.items.add(file))
			onChange?.(dataTransfer.files)
		},
		[onChange]
	)

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		maxFiles: 1,
		accept: {
			"application/pdf": [".pdf"]
		},
		...dropzoneOptions
	})

	const handleRemove = (e: React.MouseEvent) => {
		e.stopPropagation() // Evita que o clique no botão de remover abra o seletor de arquivos
		onRemove?.()
	}

	return (
		<div
			ref={ref}
			{...getRootProps()}
			className={cn(
				"relative flex items-center justify-center w-32 h-32 px-4 py-2 text-sm text-center border-2 border-dashed rounded-lg cursor-pointer border-border text-muted-foreground hover:bg-muted/50 transition-colors",
				isDragActive && "border-primary bg-primary/10",
				className
			)}
			{...props}
		>
			<Input {...getInputProps()} />

			{!file ? (
				<div className="flex flex-col items-center gap-2">
					<Upload className="w-8 h-8" />
					<p>
						<span className="font-semibold text-primary">Clique para enviar</span> ou arraste e solte
					</p>
					<p className="text-xs">Apenas arquivos PDF (máx. 5MB)</p>
				</div>
			) : (
				<div className="flex flex-col items-center justify-center w-full h-full text-foreground">
					<div className="flex flex-col items-center gap-3">
						<FileIcon className="size-6 text-primary" />
						<p className="text-sm font-medium text-ellipsis">{file.name}</p>
						<Button type="button" variant="ghost" size="icon" className="w-6 h-6 text-destructive hover:bg-destructive/10" onClick={handleRemove}>
							<X className="w-4 h-4" />
							<span className="sr-only">Remover arquivo</span>
						</Button>
					</div>
				</div>
			)}
		</div>
	)
})
FileInput.displayName = "FileInput"

export { FileInput }
