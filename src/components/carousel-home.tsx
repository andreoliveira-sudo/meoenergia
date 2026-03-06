"use client"

import Autoplay from "embla-carousel-autoplay"
import Image from "next/image"

import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import banner1 from "../../public/banner-1.jpeg"
import banner2 from "../../public/banner-2.jpeg"
import banner3 from "../../public/banner-3.jpeg"
import banner4 from "../../public/banner-4.jpeg"

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
					<Image src={banner1} alt="" fill className="object-cover dark:brightness-[0.2] dark:grayscale" />
				</CarouselItem>
				<CarouselItem className="relative h-full">
					<Image src={banner2} alt="" fill className="object-cover dark:brightness-[0.2] dark:grayscale" />
				</CarouselItem>
				<CarouselItem className="relative h-full">
					<Image src={banner3} alt="" fill className="object-cover dark:brightness-[0.2] dark:grayscale" />
				</CarouselItem>
				<CarouselItem className="relative h-full">
					<Image src={banner4} alt="" fill className="object-cover dark:brightness-[0.2] dark:grayscale" />
				</CarouselItem>
			</CarouselContent>
		</Carousel>
	)
}
