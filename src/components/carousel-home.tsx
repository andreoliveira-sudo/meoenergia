"use client"

import Autoplay from "embla-carousel-autoplay"
import Image from "next/image"

import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"

export const CarouselHome = () => {
	return (
		<Carousel
			className="bg-muted relative hidden lg:block min-h-full h-full w-full"
			opts={{
				loop: true
			}}
			plugins={[
				Autoplay({
					delay: 4000
				})
			]}
		>
			{" "}
			{/* 100% altura e largura */}
			<CarouselContent className="h-full">
				<CarouselItem className="relative h-full">
					<Image src="/banner-1.jpeg" alt="" fill className="object-cover dark:brightness-[0.2] dark:grayscale" />
				</CarouselItem>
				<CarouselItem className="relative h-full">
					<Image src="/banner-2.jpeg" alt="" fill className="object-cover dark:brightness-[0.2] dark:grayscale" />
				</CarouselItem>
				<CarouselItem className="relative h-full">
					<Image src="/banner-3.jpeg" alt="" fill className="object-cover dark:brightness-[0.2] dark:grayscale" />
				</CarouselItem>
				<CarouselItem className="relative h-full">
					<Image src="/banner-4.jpeg" alt="" fill className="object-cover dark:brightness-[0.2] dark:grayscale" />
				</CarouselItem>
			</CarouselContent>
		</Carousel>
	)
}
