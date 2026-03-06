"use client"

import Autoplay from "embla-carousel-autoplay"
import Image from "next/image"

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

export function BannerCarousel() {
	const banners = ["/banner-home-1.jpeg", "/banner-home-2.jpeg"]

	return (
		<div className="w-full">
			<Carousel
				className="w-full"
				opts={{
					loop: true,
					duration: 0 // Remove a animação de scroll
				}}
				plugins={[
					Autoplay({
						delay: 4000,
						stopOnInteraction: false
					})
				]}
			>
				<CarouselContent className="flex items-start">
					{banners.map((banner, index) => (
						<CarouselItem key={banner}>
							<div className="relative w-full h-[200px] md:h-[300px] lg:h-[400px]">
								<Image
									src={banner}
									alt={`Banner ${index + 1}`}
									fill
									className="object-contain md:object-fill xl:object-contain rounded-xl border-primary"
									priority={index === 0}
								/>
							</div>
						</CarouselItem>
					))}
				</CarouselContent>
			</Carousel>
		</div>
	)
}
