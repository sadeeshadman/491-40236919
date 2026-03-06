'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { services } from '@/lib/services';

type QuoteRequestModalProps = {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  specification?: string | null;
  sourcePage: string;
};

type QuoteFormState = {
  name: string;
  email: string;
  phone: string;
  typeOfService: string;
  specification: string;
  requestDetails: string;
  preferredContactMethod: 'email' | 'phone';
  propertyLocation: string;
};

type QuoteResponse = {
  email?: {
    sent?: boolean;
  };
};

function buildInitialFormState(serviceName: string, specification?: string | null): QuoteFormState {
  const selectedService = services.find((service) => service.name === serviceName);
  const initialTypeOfService = selectedService?.name ?? serviceName;
  const validSpecification =
    specification && selectedService?.subservices.some((item) => item.name === specification)
      ? specification
      : '';

  return {
    name: '',
    email: '',
    phone: '',
    typeOfService: initialTypeOfService,
    specification: validSpecification,
    requestDetails: '',
    preferredContactMethod: 'email',
    propertyLocation: '',
  };
}

export function QuoteRequestModal({
  isOpen,
  onClose,
  serviceName,
  specification,
  sourcePage,
}: QuoteRequestModalProps) {
  const initialState = useMemo(
    () => buildInitialFormState(serviceName, specification),
    [serviceName, specification],
  );
  const [formState, setFormState] = useState<QuoteFormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const selectedService = services.find((service) => service.name === formState.typeOfService);
  const specificationOptions = selectedService?.subservices ?? [];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormState(buildInitialFormState(serviceName, specification));
    setFeedback('');
  }, [isOpen, serviceName, specification]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback('');

    if (formState.preferredContactMethod === 'phone' && !formState.phone.trim()) {
      setFeedback('Phone number is required when preferred contact method is phone.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await apiFetch<QuoteResponse>('/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formState,
          sourcePage,
        }),
      });

      if (response.email?.sent === false) {
        setFeedback(
          'Thank you. We received your request, and our team will contact you shortly. Email notifications are temporarily delayed.',
        );
      } else {
        setFeedback('Thank you. We received your request and will contact you shortly.');
      }

      setFormState(buildInitialFormState(serviceName, specification));
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setFeedback(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur"
      onClick={onClose}
      role="presentation"
    >
      <div className="flex min-h-full items-start justify-center px-4 py-8">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Request a Quote"
          className="max-h-[calc(100vh-4rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl text-white">Request a Quote</h2>
              <p className="mt-2 text-sm text-slate-300">
                Share your requirements and our team will respond at the earliest.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-600 px-3 py-1 text-sm text-slate-200 transition hover:border-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-200">
                Full Name
                <span aria-hidden="true" className="ml-1 text-rose-400">
                  *
                </span>
                <input
                  type="text"
                  required
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((previous) => ({ ...previous, name: event.target.value }))
                  }
                  className="mt-2 w-full rounded-md border border-slate-500/90 bg-slate-950/80 px-3 py-2 text-slate-100 outline-none placeholder:text-slate-400 focus:border-slate-300"
                  placeholder="Your name"
                />
              </label>

              <label className="block text-sm font-medium text-slate-200">
                Email
                <span aria-hidden="true" className="ml-1 text-rose-400">
                  *
                </span>
                <input
                  type="email"
                  required
                  value={formState.email}
                  onChange={(event) =>
                    setFormState((previous) => ({ ...previous, email: event.target.value }))
                  }
                  className="mt-2 w-full rounded-md border border-slate-500/90 bg-slate-950/80 px-3 py-2 text-slate-100 outline-none placeholder:text-slate-400 focus:border-slate-300"
                  placeholder="you@example.com"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-200">
                Phone Number
                {formState.preferredContactMethod === 'phone' ? (
                  <span aria-hidden="true" className="ml-1 text-rose-400">
                    *
                  </span>
                ) : null}
                <input
                  type="tel"
                  required={formState.preferredContactMethod === 'phone'}
                  value={formState.phone}
                  onChange={(event) =>
                    setFormState((previous) => ({ ...previous, phone: event.target.value }))
                  }
                  className="mt-2 w-full rounded-md border border-slate-500/90 bg-slate-950/80 px-3 py-2 text-slate-100 outline-none placeholder:text-slate-400 focus:border-slate-300"
                  placeholder={
                    formState.preferredContactMethod === 'phone' ? 'Required' : 'Optional'
                  }
                />
              </label>

              <label className="block text-sm font-medium text-slate-200">
                Preferred Contact
                <span aria-hidden="true" className="ml-1 text-rose-400">
                  *
                </span>
                <select
                  required
                  value={formState.preferredContactMethod}
                  onChange={(event) =>
                    setFormState((previous) => ({
                      ...previous,
                      preferredContactMethod: event.target.value as 'email' | 'phone',
                    }))
                  }
                  className="mt-2 w-full rounded-md border border-slate-500/90 bg-slate-950/80 px-3 py-2 text-slate-100 outline-none focus:border-slate-300"
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-200">
                Type of Service
                <span aria-hidden="true" className="ml-1 text-rose-400">
                  *
                </span>
                <select
                  required
                  value={formState.typeOfService}
                  onChange={(event) =>
                    setFormState((previous) => ({
                      ...previous,
                      typeOfService: event.target.value,
                      specification: '',
                    }))
                  }
                  className="mt-2 w-full rounded-md border border-slate-500/90 bg-slate-950/80 px-3 py-2 text-slate-100 outline-none focus:border-slate-300"
                >
                  {services.map((service) => (
                    <option key={service.slug} value={service.name}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-200">
                Specification
                <select
                  value={formState.specification}
                  onChange={(event) =>
                    setFormState((previous) => ({ ...previous, specification: event.target.value }))
                  }
                  className="mt-2 w-full rounded-md border border-slate-500/90 bg-slate-950/80 px-3 py-2 text-slate-100 outline-none focus:border-slate-300"
                >
                  <option value="">Select specification</option>
                  {specificationOptions.map((subservice) => (
                    <option key={subservice.id} value={subservice.name}>
                      {subservice.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-200">
              Property Location
              <input
                type="text"
                value={formState.propertyLocation}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    propertyLocation: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-md border border-slate-500/90 bg-slate-950/80 px-3 py-2 text-slate-100 outline-none placeholder:text-slate-400 focus:border-slate-300"
                placeholder="City / Address"
              />
            </label>

            <label className="block text-sm font-medium text-slate-200">
              Details of Your Request
              <span aria-hidden="true" className="ml-1 text-rose-400">
                *
              </span>
              <textarea
                required
                rows={5}
                value={formState.requestDetails}
                onChange={(event) =>
                  setFormState((previous) => ({ ...previous, requestDetails: event.target.value }))
                }
                className="mt-2 w-full rounded-md border border-slate-500/90 bg-slate-950/80 px-3 py-2 text-slate-100 outline-none placeholder:text-slate-400 focus:border-slate-300"
                placeholder="Please describe what you need and any key context."
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quote Request'}
            </button>

            {feedback && <p className="text-sm text-slate-200">{feedback}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
