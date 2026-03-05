'use client';

import { useEffect, useState } from 'react';

const slides = [
  {
    title: 'Home Inspection',
    description:
      'Detailed inspections that reveal hidden issues early and provide clear recommendations for safer decisions.',
    image: '/slides/home-inspection.svg',
  },
  {
    title: 'Property Management',
    description:
      'Proactive support for day-to-day operations, maintenance planning, and long-term property performance.',
    image: '/slides/property-management.svg',
  },
  {
    title: 'Construction Services',
    description:
      'Reliable execution for renovations and upgrades with consistent quality control and timeline discipline.',
    image: '/slides/construction-services.svg',
  },
  {
    title: 'Engineering Consultants',
    description:
      'Technical guidance for structural and systems planning so each project stays safe, compliant, and efficient.',
    image: '/slides/engineering-consultants.svg',
  },
];

export function GallerySection() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((previous) => (previous + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  function goToSlide(index: number) {
    setActiveIndex(index);
  }

  function goToPrevious() {
    setActiveIndex((previous) => (previous - 1 + slides.length) % slides.length);
  }

  function goToNext() {
    setActiveIndex((previous) => (previous + 1) % slides.length);
  }

  return (
    <section id="home" className="scroll-mt-28">
      <div className="relative min-h-[calc(100vh-73px)] overflow-hidden border-b border-slate-700/70">
        {slides.map((slide, index) => (
          <div
            key={slide.title}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
              index === activeIndex ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url(${slide.image})` }}
          />
        ))}

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-indigo-950/70 to-slate-900/30" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_26%,rgba(34,211,238,0.22),transparent_42%),radial-gradient(circle_at_82%_75%,rgba(251,191,36,0.2),transparent_36%)]" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-6xl flex-col justify-center px-6 py-12 md:px-10">
          <p className="animate-fade-up text-sm font-semibold tracking-[0.28em] text-cyan-200 uppercase">
            Constein Group
          </p>
          <h1 className="animate-fade-up-delay-1 mt-4 max-w-3xl font-serif text-4xl leading-tight text-white md:text-6xl">
            {slides[activeIndex].title}
          </h1>
          <p className="animate-fade-up-delay-2 mt-5 max-w-2xl text-base leading-8 text-slate-100 md:text-xl">
            {slides[activeIndex].description}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={goToPrevious}
              className="rounded-full border border-cyan-300/70 bg-slate-900/40 px-4 py-2 text-sm font-medium text-cyan-100 backdrop-blur transition hover:bg-cyan-900/40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="rounded-full border border-amber-300/70 bg-slate-900/40 px-4 py-2 text-sm font-medium text-amber-100 backdrop-blur transition hover:bg-amber-900/40"
            >
              Next
            </button>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              onClick={() => goToSlide(index)}
              aria-label={`Go to ${slide.title}`}
              className={`h-2.5 rounded-full transition-all ${
                index === activeIndex
                  ? 'w-8 bg-cyan-200'
                  : 'w-2.5 bg-slate-300/70 hover:bg-cyan-100'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
