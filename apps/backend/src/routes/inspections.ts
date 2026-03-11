import { Router } from 'express';
import mongoose from 'mongoose';
import puppeteer, { type Browser } from 'puppeteer';
import { Readable } from 'stream';
import { z } from 'zod';
import { dbConnect } from '../lib/mongodb';
import { Inspection } from '../models/Inspection';
import {
  draftExpiryDays,
  getInitialSections,
  inspectionStatusValues,
  propertyTypeValues,
  type InspectionStatus,
  urgencyValues,
} from '../inspections/templates';

const startInspectionSchema = z
  .object({
    propertyAddress: z.string().trim().min(1),
    propertyType: z.enum(propertyTypeValues),
  })
  .strict();

function getDraftExpiryDate() {
  return new Date(Date.now() + draftExpiryDays * 24 * 60 * 60 * 1000);
}

const findingSchema = z
  .object({
    component: z.string().trim().min(1),
    condition: z.string().trim().min(1),
    implication: z.string().trim().min(1),
    recommendation: z.string().trim().min(1),
    urgency: z.enum(urgencyValues),
    imageUrls: z.array(z.string().trim()).default([]),
  })
  .strict();

const sectionSchema = z
  .object({
    title: z.string().trim().min(1),
    isApplicable: z.boolean(),
    limitations: z.string().trim(),
    findings: z.array(findingSchema),
  })
  .strict();

const updateInspectionSchema = z
  .object({
    propertyAddress: z.string().trim().min(1),
    propertyType: z.enum(propertyTypeValues),
    status: z.enum(inspectionStatusValues),
    sections: z.array(sectionSchema),
  })
  .strict();

function isValidObjectId(value: string) {
  return mongoose.Types.ObjectId.isValid(value);
}

type PdfFinding = {
  component: string;
  condition: string;
  implication: string;
  recommendation: string;
  urgency: string;
  imageUrls: string[];
};

type PdfSection = {
  title: string;
  findings: PdfFinding[];
};

type PdfInspection = {
  _id: mongoose.Types.ObjectId;
  authorId?: mongoose.Types.ObjectId | null;
  propertyAddress: string;
  propertyType: string;
  status: string;
  createdAt?: Date | string;
  sections: PdfSection[];
};

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDisplayDate(value: Date | string | undefined) {
  if (!value) {
    return 'N/A';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'N/A';
  }

  return parsed.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export const inspectionsRouter = Router();

inspectionsRouter.post('/start', async (req, res) => {
  try {
    const parseResult = startInspectionSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    await dbConnect();

    const payload = parseResult.data;
    const status: InspectionStatus = 'Draft';
    const expiresAt = status === 'Draft' ? getDraftExpiryDate() : undefined;

    const inspection = await Inspection.create({
      propertyAddress: payload.propertyAddress,
      propertyType: payload.propertyType,
      status,
      expiresAt,
      sections: getInitialSections(payload.propertyType),
    });

    return res.status(201).json({ inspection });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return res.status(500).json({ error: message });
  }
});

inspectionsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid inspection id' });
    }

    await dbConnect();

    const inspection = await Inspection.findById(id);

    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    return res.json({ inspection });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return res.status(500).json({ error: message });
  }
});

inspectionsRouter.get('/:id/pdf', async (req, res) => {
  let browser: Browser | null = null;

  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid inspection id' });
    }

    await dbConnect();

    const inspection = (await Inspection.findById(id).lean()) as PdfInspection | null;
    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    let author: { name?: string; email?: string } | null = null;
    if (inspection.authorId) {
      const usersCollection = mongoose.connection.db?.collection('Users');
      if (usersCollection) {
        author = (await usersCollection.findOne(
          { _id: inspection.authorId },
          { projection: { name: 1, email: 1 } },
        )) as { name?: string; email?: string } | null;
      }
    }

    const findingsBySection = inspection.sections
      .filter((section) => section.findings.length > 0)
      .map((section) => ({
        sectionTitle: section.title,
        findings: section.findings,
      }));

    const safetyFindings = inspection.sections.flatMap((section) =>
      section.findings
        .filter((finding) => finding.urgency === 'Safety')
        .map((finding) => ({
          sectionTitle: section.title,
          component: finding.component,
          condition: finding.condition,
          implication: finding.implication,
          recommendation: finding.recommendation,
        })),
    );

    const safetySummaryHtml =
      safetyFindings.length > 0
        ? safetyFindings
            .map(
              (finding, index) => `
                <article class='rounded-lg border border-red-200 bg-white p-4'>
                  <p class='text-xs font-semibold tracking-wide text-red-700 uppercase'>Safety ${index + 1} • ${escapeHtml(
                    finding.sectionTitle,
                  )}</p>
                  <h4 class='mt-1 text-sm font-bold text-slate-900'>${escapeHtml(
                    finding.component,
                  )}</h4>
                  <p class='mt-1 text-sm text-slate-700'><span class='font-semibold'>Condition:</span> ${escapeHtml(
                    finding.condition,
                  )}</p>
                  <p class='mt-1 text-sm text-slate-700'><span class='font-semibold'>Implication:</span> ${escapeHtml(
                    finding.implication,
                  )}</p>
                  <p class='mt-1 text-sm text-slate-700'><span class='font-semibold'>Recommendation:</span> ${escapeHtml(
                    finding.recommendation,
                  )}</p>
                </article>
              `,
            )
            .join('')
        : "<p class='text-sm text-slate-700'>No findings were marked with <span class='font-semibold text-red-700'>Safety</span> urgency.</p>";

    const systemsHtml =
      findingsBySection.length > 0
        ? findingsBySection
            .map(
              (section) => `
                <section class='mb-8 break-inside-avoid'>
                  <h3 class='border-b border-slate-200 pb-2 text-lg font-bold text-slate-900'>${escapeHtml(
                    section.sectionTitle,
                  )}</h3>
                  <div class='mt-4 space-y-4'>
                    ${section.findings
                      .map(
                        (finding, index) => `
                          <article class='rounded-lg border border-slate-200 bg-white p-4 break-inside-avoid'>
                            <p class='text-xs font-semibold tracking-wide text-slate-500 uppercase'>Finding ${index + 1} • ${escapeHtml(
                              finding.urgency,
                            )}</p>
                            <h4 class='mt-1 text-base font-bold text-slate-900'>${escapeHtml(
                              finding.component,
                            )}</h4>
                            <p class='mt-2 text-sm text-slate-700'><span class='font-semibold'>Condition:</span> ${escapeHtml(
                              finding.condition,
                            )}</p>
                            <p class='mt-2 text-sm text-slate-700'><span class='font-semibold'>Implication:</span> ${escapeHtml(
                              finding.implication,
                            )}</p>
                            <p class='mt-2 text-sm text-slate-700'><span class='font-semibold'>Recommendation:</span> ${escapeHtml(
                              finding.recommendation,
                            )}</p>

                            ${finding.imageUrls.length > 0 ? "<h5 class='mt-3 text-xs font-semibold tracking-wide text-slate-500 uppercase'>Evidence Images</h5>" : ''}
                            ${
                              finding.imageUrls.length > 0
                                ? `<div class='mt-2 grid grid-cols-2 gap-2'>
                                    ${finding.imageUrls
                                      .map(
                                        (url) => `
                                          <img
                                            src='${escapeHtml(url)}'
                                            alt='Finding evidence image'
                                            class='h-40 w-full rounded-md border border-slate-200 object-cover'
                                          />
                                        `,
                                      )
                                      .join('')}
                                  </div>`
                                : ''
                            }
                          </article>
                        `,
                      )
                      .join('')}
                  </div>
                </section>
              `,
            )
            .join('')
        : "<p class='text-sm text-slate-700'>No findings have been added to this report yet.</p>";

    const reportHtml = `
      <!doctype html>
      <html lang='en'>
        <head>
          <meta charset='utf-8' />
          <meta name='viewport' content='width=device-width, initial-scale=1' />
          <script src='https://cdn.tailwindcss.com'></script>
          <style>
            @page {
              size: A4;
            }

            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .break-inside-avoid {
              break-inside: avoid;
            }
          </style>
          <title>Property Inspection Report</title>
        </head>
        <body class='bg-slate-50 p-6 text-slate-900'>
          <header class='mb-6 rounded-xl border border-slate-200 bg-white p-5'>
            <h1 class='text-2xl font-bold text-slate-900'>Property Inspection Report</h1>
            <p class='mt-1 text-base text-slate-700'>${escapeHtml(inspection.propertyAddress)}</p>

            <div class='mt-4 grid grid-cols-2 gap-2 text-sm text-slate-600'>
              <p><span class='font-semibold'>Property Type:</span> ${escapeHtml(inspection.propertyType)}</p>
              <p><span class='font-semibold'>Status:</span> ${escapeHtml(inspection.status)}</p>
              <p><span class='font-semibold'>Prepared On:</span> ${escapeHtml(
                formatDisplayDate(new Date()),
              )}</p>
              <p><span class='font-semibold'>Created:</span> ${escapeHtml(
                formatDisplayDate(inspection.createdAt),
              )}</p>
              <p><span class='font-semibold'>Inspector:</span> ${escapeHtml(
                author?.name ?? 'Unassigned',
              )}</p>
              <p><span class='font-semibold'>Inspector Email:</span> ${escapeHtml(
                author?.email ?? 'N/A',
              )}</p>
            </div>
          </header>

          <section class='mb-8 rounded-xl border-2 border-red-300 bg-red-50 p-5 break-inside-avoid'>
            <h2 class='text-lg font-bold text-red-700'>Executive Summary - Safety Findings</h2>
            <p class='mt-1 text-sm text-red-700'>These findings are marked as <span class='font-semibold'>Safety</span> urgency and should be addressed promptly.</p>
            <div class='mt-4 space-y-3'>
              ${safetySummaryHtml}
            </div>
          </section>

          <section>
            <h2 class='mb-4 text-xl font-bold text-slate-900'>System-by-System Findings</h2>
            ${systemsHtml}
          </section>
        </body>
      </html>
    `;

    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      ...(executablePath ? { executablePath } : {}),
    });

    const page = await browser.newPage();
    await page.setContent(reportHtml, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '40px' },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate:
        "<div style='font-size:10px; width:100%; text-align:center; color:#64748b;'>This report follows the CAHPI/OAHI Standards of Practice.</div>",
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=inspection-${id}.pdf`);

    const pdfStream = Readable.from(pdfBuffer);
    pdfStream.pipe(res);
    return;
  } catch (err: unknown) {
    console.error('PDF generation error:', err);
    return res.status(500).json({
      error: 'PDF Generation failed due to system environment issues.',
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

inspectionsRouter.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid inspection id' });
    }

    const parseResult = updateInspectionSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    await dbConnect();

    const payload = parseResult.data;
    const expiresAt = payload.status === 'Draft' ? getDraftExpiryDate() : null;

    const inspection = await Inspection.findByIdAndUpdate(
      id,
      {
        propertyAddress: payload.propertyAddress,
        propertyType: payload.propertyType,
        status: payload.status,
        sections: payload.sections,
        expiresAt,
      },
      { new: true, runValidators: true },
    );

    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    return res.json({ inspection });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return res.status(500).json({ error: message });
  }
});
