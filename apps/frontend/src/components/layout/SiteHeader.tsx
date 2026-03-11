'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { services } from '@/lib/services';
import { getServicePath, getSubservicePath } from '@/lib/servicePaths';

const navItemsBeforeServices = [{ label: 'Home', href: '/#home' }];
const navItemsAfterServices = [
  { label: 'About Us', href: '/#about-us' },
  { label: 'Contact Us', href: '/#contact-us' },
];

export function SiteHeader() {
  const [servicesOpen, setServicesOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-30 border-b border-slate-700/70 bg-slate-950/95 backdrop-blur"
      onMouseLeave={() => setServicesOpen(false)}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 md:px-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="hidden md:flex" aria-label="Constein Group home">
            <Image
              src="/logo1.png"
              alt="Constein Group logo"
              width={160}
              height={44}
              className="h-11 w-auto"
              priority
            />
          </Link>

          <Link href="/" className="md:hidden" aria-label="Constein Group home">
            <Image
              src="/logo1.png"
              alt="Constein Group logo"
              width={112}
              height={100}
              className="h-10 w-auto"
            />
          </Link>
        </div>

        <nav className="relative flex items-center gap-3 text-sm font-medium text-slate-200 sm:gap-4 md:gap-5">
          {navItemsBeforeServices.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-md px-2 py-1 transition-colors hover:bg-slate-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}

          <button
            type="button"
            onMouseEnter={() => setServicesOpen(true)}
            onClick={() => setServicesOpen((previous) => !previous)}
            aria-expanded={servicesOpen}
            className="rounded-md px-2 py-1 transition-colors hover:bg-slate-800 hover:text-white"
          >
            Services
          </button>

          {navItemsAfterServices.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-md px-2 py-1 transition-colors hover:bg-slate-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}

          <Link
            href="/api/auth/signin"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-600 bg-slate-900 transition hover:border-indigo-400"
            title="Inspector login"
            aria-label="Inspector login"
          >
            <Image src="/login.png" alt="Login" width={20} height={20} className="h-5 w-5" />
          </Link>
        </nav>
      </div>

      {servicesOpen && (
        <div className="absolute top-full left-0 z-40 w-full border-t border-slate-700 bg-slate-950/98 shadow-2xl backdrop-blur">
          <div className="grid w-full grid-cols-1 gap-8 px-6 py-6 md:grid-cols-2 md:px-10 xl:grid-cols-4 xl:gap-6">
            {services.map((service) => (
              <div key={service.slug} className="min-w-0 space-y-3 xl:px-3">
                <Link
                  href={getServicePath(service.slug)}
                  onClick={() => setServicesOpen(false)}
                  className="inline-flex border-b border-slate-700 pb-1 font-semibold text-slate-100 hover:text-white"
                >
                  {service.name}
                </Link>

                {service.subservices.length > 0 ? (
                  <ul className="space-y-2 text-xs leading-6 text-slate-300">
                    {service.subservices.map((subservice) => (
                      <li key={subservice.id}>
                        <Link
                          href={getSubservicePath(service.slug, subservice.id)}
                          onClick={() => setServicesOpen(false)}
                          className="transition-colors hover:text-slate-100"
                        >
                          {subservice.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs leading-6 text-slate-400">{service.shortDescription}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
