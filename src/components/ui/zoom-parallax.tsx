'use client';

import { useScroll, useTransform, motion } from 'framer-motion';
import { useRef } from 'react';
import { BlurOutUp } from '@/components/ui/blur-out-up';

interface Image {
	src: string;
	alt?: string;
}

interface ZoomParallaxProps {
	/** Array of images to be displayed in the parallax effect */
	images: Image[];
	title?: string;
	subtitle?: string;
	kicker?: string;
	preScrollTitle?: string;
	preScrollSubtitle?: string;
	preScrollKicker?: string;
	ctaText?: string;
}

export function ZoomParallax({
	images,
	title = 'Historic Palaces & Sovereign Venues',
	subtitle = 'The sovereign archive of Egypt’s premier royal palaces, Nile heritage waterfronts, and presidential diplomatic estates',
	kicker = 'Curated Luxury Landmark Venues',
	preScrollTitle = 'Scroll Down to Reveal the Full Experience',
	preScrollSubtitle = 'Scroll down to zoom through the palatial grounds and step inside the sovereign archive',
	preScrollKicker = 'Interactive Heritage Discovery',
	ctaText = 'Explore Royal Venues',
}: ZoomParallaxProps) {
	const container = useRef<HTMLDivElement>(null);
	const { scrollYProgress } = useScroll({
		target: container,
		offset: ['start start', 'end end'],
	});

	const scale4 = useTransform(scrollYProgress, [0, 1], [1, 4]);
	const scale5 = useTransform(scrollYProgress, [0, 1], [1, 5]);
	const scale5_5 = useTransform(scrollYProgress, [0, 1], [1, 5.5]);
	const scale6 = useTransform(scrollYProgress, [0, 1], [1, 6]);
	const scale6_5 = useTransform(scrollYProgress, [0, 1], [1, 6.5]);
	const scale7 = useTransform(scrollYProgress, [0, 1], [1, 7]);
	const scale7_5 = useTransform(scrollYProgress, [0, 1], [1, 7.5]);
	const scale8 = useTransform(scrollYProgress, [0, 1], [1, 8]);
	const scale8_5 = useTransform(scrollYProgress, [0, 1], [1, 8.5]);
	const scale9 = useTransform(scrollYProgress, [0, 1], [1, 9]);

	// Phase 1: Pre-scroll guidance fades away as user scrolls down from 0 to 0.25
	const preScrollOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
	const preScrollY = useTransform(scrollYProgress, [0, 0.25], [0, -35]);

	// Phase 2: Post-scroll grand hero text reveals after scrolling down through the parallax (0.58 -> 0.92)
	const postScrollOpacity = useTransform(scrollYProgress, [0.58, 0.92], [0, 1]);
	const postScrollY = useTransform(scrollYProgress, [0.58, 0.92], [32, 0]);

	// Scroll cue indicator fades out as soon as the user starts scrolling
	const scrollCueOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0]);

	const scales = [
		scale4,
		scale5,
		scale6,
		scale5_5,
		scale6_5,
		scale5,
		scale7,
		scale7_5,
		scale6,
		scale8,
		scale6_5,
		scale8_5,
		scale5_5,
		scale8,
		scale9,
	];

	const layerOffsets = [
		'[&>div]:!top-0 [&>div]:!left-0 [&>div]:!h-[25vh] [&>div]:!w-[25vw] [&>div]:!z-20',
		'[&>div]:!-top-[26vh] [&>div]:!left-[8vw] [&>div]:!h-[26vh] [&>div]:!w-[28vw] [&>div]:!z-[8]',
		'[&>div]:!-top-[14vh] [&>div]:!-left-[22vw] [&>div]:!h-[36vh] [&>div]:!w-[20vw] [&>div]:!z-[7]',
		'[&>div]:!-top-[1vh] [&>div]:!left-[26vw] [&>div]:!h-[24vh] [&>div]:!w-[22vw] [&>div]:!z-[8]',
		'[&>div]:!top-[25vh] [&>div]:!left-[7vw] [&>div]:!h-[23vh] [&>div]:!w-[22vw] [&>div]:!z-[9]',
		'[&>div]:!top-[25vh] [&>div]:!-left-[19vw] [&>div]:!h-[24vh] [&>div]:!w-[26vw] [&>div]:!z-[8]',
		'[&>div]:!top-[22vh] [&>div]:!left-[27vw] [&>div]:!h-[18vh] [&>div]:!w-[17vw] [&>div]:!z-[7]',
		'[&>div]:!-top-[28vh] [&>div]:!-left-[34vw] [&>div]:!h-[26vh] [&>div]:!w-[24vw] [&>div]:!z-[5]',
		'[&>div]:!-top-[33vh] [&>div]:!-left-[12vw] [&>div]:!h-[20vh] [&>div]:!w-[22vw] [&>div]:!z-[4]',
		'[&>div]:!-top-[28vh] [&>div]:!left-[34vw] [&>div]:!h-[27vh] [&>div]:!w-[23vw] [&>div]:!z-[5]',
		'[&>div]:!top-[10vh] [&>div]:!-left-[36vw] [&>div]:!h-[28vh] [&>div]:!w-[20vw] [&>div]:!z-[6]',
		'[&>div]:!-top-[16vh] [&>div]:!left-[37vw] [&>div]:!h-[22vh] [&>div]:!w-[18vw] [&>div]:!z-[6]',
		'[&>div]:!top-[32vh] [&>div]:!-left-[6vw] [&>div]:!h-[22vh] [&>div]:!w-[24vw] [&>div]:!z-[6]',
		'[&>div]:!top-[31vh] [&>div]:!-left-[35vw] [&>div]:!h-[24vh] [&>div]:!w-[22vw] [&>div]:!z-[5]',
		'[&>div]:!top-[32vh] [&>div]:!left-[35vw] [&>div]:!h-[23vh] [&>div]:!w-[21vw] [&>div]:!z-[5]',
	];

	return (
		<div ref={container} className="relative h-[300vh] w-full">
			<div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center">
				{/* 1. Pre-Scroll Guidance (Informs the user to scroll to view the full experience) */}
				<motion.div
					style={{ opacity: preScrollOpacity, y: preScrollY }}
					className="absolute top-[17vh] z-30 text-center w-[92%] max-w-[820px] pointer-events-auto px-6 py-4"
				>
					<div className="absolute inset-[-1.25rem_-2rem] rounded-[2.25rem] bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur-md border border-stone-200/50 dark:border-stone-800/60 shadow-xl pointer-events-none -z-10" />
					<div className="relative z-10 flex flex-col items-center">
						{preScrollKicker && (
							<span className="inline-block text-xs uppercase tracking-widest font-semibold text-amber-700 dark:text-amber-500 mb-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
								{preScrollKicker}
							</span>
						)}
						<h2 className="text-3xl md:text-5xl font-bold tracking-tight text-stone-900 dark:text-stone-100 mb-3 font-serif">
							{preScrollTitle}
						</h2>
						{preScrollSubtitle && (
							<p className="text-base md:text-lg text-stone-600 dark:text-stone-400 max-w-xl mx-auto">
								{preScrollSubtitle}
							</p>
						)}
					</div>
				</motion.div>

				{/* 2. Parallax Image Mosaic Layers */}
				{images.map(({ src, alt }, index) => {
					const scale = scales[index % scales.length];
					const layerOffsetClass = layerOffsets[index % layerOffsets.length];

					return (
						<motion.div
							key={index}
							style={{ scale }}
							className={`absolute top-0 flex h-full w-full items-center justify-center ${layerOffsetClass}`}
						>
							<div className="relative h-[25vh] w-[25vw] rounded-[6px] overflow-hidden shadow-2xl">
								<img
									src={src || '/placeholder.svg'}
									sizes={index === 0 ? '100vw' : '25vw'}
									loading={index < 4 ? 'eager' : 'lazy'}
									alt={alt || `Parallax image ${index + 1}`}
									className="h-full w-full object-cover [image-rendering:-webkit-optimize-contrast]"
								/>
							</div>
						</motion.div>
					);
				})}

				{/* 3. Post-Scroll Hero Reveal (Grand Title with BlurOutUp, Subtitle & Action CTA) */}
				<motion.div
					style={{ opacity: postScrollOpacity, y: postScrollY }}
					className="absolute top-[13vh] z-35 text-center w-[92%] max-w-[900px] pointer-events-auto px-8 py-6"
				>
					<div className="absolute inset-[-1.5rem_-2.5rem] rounded-[2.5rem] bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur-lg border border-amber-500/25 shadow-2xl pointer-events-none -z-10" />
					<div className="relative z-10 flex flex-col items-center">
						{kicker && (
							<span className="inline-block text-xs uppercase tracking-widest font-semibold text-amber-700 dark:text-amber-500 mb-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
								{kicker}
							</span>
						)}
						<h1 className="text-4xl md:text-6xl font-bold tracking-tight text-stone-900 dark:text-stone-100 mb-3 font-serif">
							<BlurOutUp text={title} delay={0.08} wordStagger={0.03} />
						</h1>
						{subtitle && (
							<p className="text-base md:text-xl text-stone-600 dark:text-stone-400 max-w-2xl mx-auto mb-6">
								<BlurOutUp text={subtitle} delay={0.3} wordStagger={0.02} />
							</p>
						)}
						<a
							href="#explore-venues"
							className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 font-medium text-sm"
						>
							<span>{ctaText}</span>
							<span>→</span>
						</a>
					</div>
				</motion.div>

				{/* 4. Floating Scroll Cue Indicator */}
				<motion.div
					style={{ opacity: scrollCueOpacity }}
					className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 pointer-events-auto"
				>
					<div className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-100/90 dark:bg-stone-900/90 backdrop-blur-md border border-stone-200/50 dark:border-stone-800/50 shadow-md text-xs font-semibold text-stone-700 dark:text-stone-300">
						<span>Scroll down to begin ↓</span>
					</div>
				</motion.div>
			</div>
		</div>
	);
}

export default ZoomParallax;
