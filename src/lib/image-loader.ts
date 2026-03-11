"use client"

interface ImageLoaderParams {
	src: string
	width: number
	quality?: number
}

export default function imageLoader({ src }: ImageLoaderParams): string {
	const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""
	if (basePath && src.startsWith(basePath)) return src
	const normalizedSrc = src.startsWith("/") ? src : `/${src}`
	return `${basePath}${normalizedSrc}`
}
