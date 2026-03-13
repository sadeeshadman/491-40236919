'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { services } from '@/lib/services';
import { getServicePath, getSubservicePath } from '@/lib/servicePaths';

const navItemsBeforeServices = [{ label: 'Home', href: '/#home' }];
const navItemsAfterServices = [
  { label: 'About Us', href: '/#about-us' },
  { label: 'Contact Us', href: '/#contact-us' },
];

type SessionUser = {
  name?: string;
  email?: string;
  role?: string;
};

export function SiteHeader() {
  const [servicesOpen, setServicesOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadSessionUser() {
      try {
        const response = await fetch('/api/auth/session', { cache: 'no-store' });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { user?: SessionUser | null };

        if (!isCancelled) {
          setSessionUser(data.user ?? null);
        }
      } catch {
        if (!isCancelled) {
          setSessionUser(null);
        }
      }
    }

    void loadSessionUser();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, []);

  const userInitial = useMemo(() => {
    const source = sessionUser?.name?.trim() || sessionUser?.email?.trim() || '';
    return source ? source.charAt(0).toUpperCase() : '?';
  }, [sessionUser]);

  async function handleLogout() {
    await signOut({ callbackUrl: '/' });
  }

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
              height={40}
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

          <div className="relative" ref={accountMenuRef}>
            {sessionUser ? (
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen((previous) => !previous)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-indigo-400/70 bg-indigo-500/20 text-sm font-semibold text-indigo-100 transition hover:border-indigo-300"
                title="Account"
                aria-label="Open account menu"
                aria-expanded={isAccountMenuOpen}
              >
                {userInitial}
              </button>
            ) : (
              <Link
                href="/api/auth/signin"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-600 bg-slate-900 transition hover:border-indigo-400"
                title="Inspector login"
                aria-label="Inspector login"
              >
                <Image src="/login.png" alt="Login" width={20} height={20} className="h-5 w-5" />
              </Link>
            )}

            {sessionUser && isAccountMenuOpen ? (
              <div className="absolute top-11 right-0 z-50 w-56 rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur">
                <p className="text-xs tracking-[0.2em] text-slate-400 uppercase">Signed In</p>
                <p className="mt-1 truncate text-sm font-semibold text-white">
                  {sessionUser.name ?? 'Inspector'}
                </p>
                <p className="truncate text-xs text-slate-300">{sessionUser.email ?? 'No email'}</p>

                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="mt-3 w-full rounded-md bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-500"
                >
                  Log Out
                </button>
              </div>
            ) : null}
          </div>
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
