import { AboutSection } from '@/components/home/AboutSection';
import { ContactSection } from '@/components/home/ContactSection';
import { GallerySection } from '@/components/home/GallerySection';
import { ServicesSection } from '@/components/home/ServicesSection';
import { SiteHeader } from '@/components/layout/SiteHeader';

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute top-[28rem] -right-28 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute bottom-20 left-1/3 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
      </div>

      <SiteHeader />
      <GallerySection />
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-24 px-6 py-12 md:px-10 md:py-16">
        <ServicesSection />
        <AboutSection />
        <ContactSection />
      </main>
    </div>
  );
}
