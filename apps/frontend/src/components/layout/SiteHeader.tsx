import Link from 'next/link';

const navItems = [
  { label: 'Home', href: '/#home' },
  { label: 'Services', href: '/#services' },
  { label: 'About Us', href: '/#about-us' },
  { label: 'Contact Us', href: '/#contact-us' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-700/70 bg-gradient-to-r from-slate-950/95 via-indigo-950/90 to-slate-900/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 md:px-10">
        <div className="hidden md:flex">
          <div className="flex h-11 w-36 items-center justify-center rounded-md border border-dashed border-cyan-300/70 bg-slate-900/90 text-xs font-semibold tracking-[0.24em] text-cyan-100 uppercase">
            Logo
          </div>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-dashed border-cyan-300/70 bg-slate-900 text-xs font-semibold tracking-[0.16em] text-cyan-100 uppercase md:hidden">
          CG
        </div>

        <nav className="flex items-center gap-2 text-sm font-medium text-slate-200 sm:gap-3 md:gap-5">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-md px-2 py-1 transition-colors hover:bg-indigo-500/30 hover:text-cyan-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
