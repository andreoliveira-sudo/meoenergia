"use client"

interface ImageLoaderParams {
	src: string
	width: number
	quality?: number
}

export default function imageLoader({ src }: ImageLoaderParams): string {
	const basePath = "/meo"
	if (src.startsWith(basePath)) return src
	const normalizedSrc = src.startsWith("/") ? src : `/${src}`
	return `${basePath}${normalizedSrc}`
}
