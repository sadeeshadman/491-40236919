'use client';

import { FormEvent, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { SectionHeading } from './SectionHeading';

type ContactFormState = {
  name: string;
  email: string;
  message: string;
};

const initialFormState: ContactFormState = {
  name: '',
  email: '',
  message: '',
};

export function ContactSection() {
  const [formState, setFormState] = useState<ContactFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback('');

    try {
      await apiFetch('/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formState),
      });

      setFormState(initialFormState);
      setFeedback('Thank you. We received your request and will contact you shortly.');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setFeedback(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="contact-us" className="scroll-mt-28 space-y-8 pb-14">
      <SectionHeading
        eyebrow="Contact Us"
        title="Talk to Constein Group About Your Home Project"
        description="Share your requirements and our team will get back to you with clear next steps tailored to your property needs."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="animate-fade-up-delay-1 relative overflow-hidden rounded-xl border border-slate-700 bg-gradient-to-br from-teal-900/35 via-slate-900 to-slate-900 p-6">
          <div className="pointer-events-none absolute -top-10 -right-12 h-28 w-28 rounded-full bg-teal-300/12 blur-2xl" />
          <h3 className="font-serif text-2xl text-white">Contact Details</h3>
          <div className="mt-5 space-y-4 text-sm text-slate-200 md:text-base">
            <p>
              <span className="font-semibold text-slate-300">Phone:</span> +1 (555) 321-0044
            </p>
            <p>
              <span className="font-semibold text-slate-300">Email:</span> info@consteingroup.com
            </p>
            <p>
              <span className="font-semibold text-slate-300">Location:</span> 245 Harbor Avenue,
              Suite 18, Wilmington, NC
            </p>
            <p>
              <span className="font-semibold text-slate-300">Hours:</span> Monday - Friday, 9:00 AM
              - 6:00 PM
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="animate-fade-up-delay-2 relative overflow-hidden rounded-xl border border-slate-700 bg-gradient-to-br from-indigo-900/35 via-slate-900 to-slate-900 p-6"
        >
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-28 w-28 rounded-full bg-indigo-300/12 blur-2xl" />
          <h3 className="font-serif text-2xl text-white">Send Us a Message</h3>

          <div className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-slate-200">
              Name
              <input
                type="text"
                required
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, name: event.target.value }))
                }
                className="mt-2 w-full rounded-md border border-slate-500/90 bg-slate-950/80 px-3 py-2 text-slate-100 ring-0 outline-none placeholder:text-slate-400 focus:border-slate-300"
                placeholder="Your name"
              />
            </label>

            <label className="block text-sm font-medium text-slate-200">
              Email
              <input
                type="email"
                required
                value={formState.email}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, email: event.target.value }))
                }
                className="mt-2 w-full rounded-md border border-slate-500/90 bg-slate-950/80 px-3 py-2 text-slate-100 ring-0 outline-none placeholder:text-slate-400 focus:border-slate-300"
                placeholder="you@example.com"
              />
            </label>

            <label className="block text-sm font-medium text-slate-200">
              Message
              <textarea
                required
                rows={5}
                value={formState.message}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, message: event.target.value }))
                }
                className="mt-2 w-full rounded-md border border-slate-500/90 bg-slate-950/80 px-3 py-2 text-slate-100 ring-0 outline-none placeholder:text-slate-400 focus:border-slate-300"
                placeholder="Tell us how we can help"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>

          {feedback && <p className="mt-4 text-sm text-slate-200">{feedback}</p>}
        </form>
      </div>
    </section>
  );
}
