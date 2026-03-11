import { Router } from 'express';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
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
    authorId: z.string().trim().optional(),
  })
  .strict();

function getDraftExpiryDate() {
  return new Date(Date.now() + draftExpiryDays * 24 * 60 * 60 * 1000);
}

const finalizeRevertWindowMs = 10 * 60 * 1000;

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

type FindingNarrative = Pick<PdfFinding, 'condition' | 'implication' | 'recommendation'>;

type PdfInspection = {
  _id: mongoose.Types.ObjectId;
  authorId?: mongoose.Types.ObjectId | null;
  propertyAddress: string;
  propertyType: string;
  status: string;
  createdAt?: Date | string;
  sections: PdfSection[];
};

type PdfAuthor = {
  name?: string;
  email?: string;
} | null;

type PdfDoc = InstanceType<typeof PDFDocument>;

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

function ensurePdfSpace(doc: PdfDoc, minimumHeight = 72) {
  const bottomEdge = doc.page.height - doc.page.margins.bottom - 24;

  if (doc.y + minimumHeight > bottomEdge) {
    doc.addPage();
  }
}

function writePdfLabelValue(doc: PdfDoc, label: string, value: string) {
  doc.fillColor('#0f172a').font('Helvetica-Bold').text(`${label}: `, { continued: true });
  doc.font('Helvetica').text(value);
}

function renderFindingNarrativeHtml(
  finding: FindingNarrative,
  spacingClass: 'mt-1' | 'mt-2',
): string {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Condition', value: finding.condition },
    { label: 'Implication', value: finding.implication },
    { label: 'Recommendation', value: finding.recommendation },
  ];

  return rows
    .map(
      ({ label, value }) =>
        `<p class='${spacingClass} text-sm text-slate-700'><span class='font-semibold'>${label}:</span> ${escapeHtml(
          value,
        )}</p>`,
    )
    .join('');
}

function writePdfFindingNarrative(doc: PdfDoc, finding: FindingNarrative) {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Condition', value: finding.condition },
    { label: 'Implication', value: finding.implication },
    { label: 'Recommendation', value: finding.recommendation },
  ];

  rows.forEach(({ label, value }) => {
    doc.text(`${label}: ${value}`);
  });
}

async function buildFallbackPdfBuffer(inspection: PdfInspection, author: PdfAuthor) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 48,
    bufferPages: true,
    info: {
      Title: `Inspection Report ${inspection.propertyAddress}`,
      Author: author?.name ?? 'Constein',
    },
  });

  const bufferPromise = new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const safetyFindings = inspection.sections.flatMap((section) =>
    section.findings
      .filter((finding) => finding.urgency === 'Safety')
      .map((finding) => ({
        sectionTitle: section.title,
        ...finding,
      })),
  );

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(21).text('Property Inspection Report');
  doc.moveDown(0.35);
  doc.fontSize(13).font('Helvetica').fillColor('#334155').text(inspection.propertyAddress);
  doc.moveDown(0.9);

  doc.fontSize(11);
  writePdfLabelValue(doc, 'Property Type', inspection.propertyType);
  writePdfLabelValue(doc, 'Status', inspection.status);
  writePdfLabelValue(doc, 'Prepared On', formatDisplayDate(new Date()));
  writePdfLabelValue(doc, 'Created', formatDisplayDate(inspection.createdAt));
  writePdfLabelValue(doc, 'Inspector', author?.name?.trim() || 'Unassigned');
  writePdfLabelValue(doc, 'Inspector Email', author?.email?.trim() || 'N/A');
  doc.moveDown(1.1);

  doc
    .fillColor('#b91c1c')
    .font('Helvetica-Bold')
    .fontSize(16)
    .text('Executive Summary - Safety Findings');
  doc.moveDown(0.45);
  doc.font('Helvetica').fontSize(10.5).fillColor('#334155');

  if (safetyFindings.length === 0) {
    doc.text('No findings were marked with Safety urgency.');
  } else {
    safetyFindings.forEach((finding, index) => {
      ensurePdfSpace(doc, 90);
      doc
        .fillColor('#991b1b')
        .font('Helvetica-Bold')
        .text(`Safety ${index + 1} - ${finding.sectionTitle}`);
      doc.fillColor('#0f172a').font('Helvetica-Bold').text(finding.component);
      doc.fillColor('#334155').font('Helvetica');
      writePdfFindingNarrative(doc, finding);
      doc.moveDown(0.7);
    });
  }

  doc.moveDown(0.8);
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(16).text('System-by-System Findings');
  doc.moveDown(0.5);

  const sectionsWithFindings = inspection.sections.filter((section) => section.findings.length > 0);

  if (sectionsWithFindings.length === 0) {
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor('#334155')
      .text('No findings have been added to this report yet.');
  } else {
    sectionsWithFindings.forEach((section) => {
      ensurePdfSpace(doc, 64);
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(14).text(section.title);
      doc.moveDown(0.25);

      section.findings.forEach((finding, index) => {
        ensurePdfSpace(doc, 132);
        doc
          .fillColor('#64748b')
          .font('Helvetica-Bold')
          .fontSize(10)
          .text(`Finding ${index + 1} - ${finding.urgency}`);
        doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(12).text(finding.component);
        doc.fillColor('#334155').font('Helvetica').fontSize(10.5);
        writePdfFindingNarrative(doc, finding);

        if (finding.imageUrls.length > 0) {
          doc.moveDown(0.25);
          doc.fillColor('#0f172a').font('Helvetica-Bold').text('Evidence Images');
          doc.font('Helvetica').fillColor('#2563eb');

          finding.imageUrls.forEach((url) => {
            ensurePdfSpace(doc, 24);
            doc.text(url, {
              link: url,
              underline: true,
            });
          });

          doc.fillColor('#334155');
        }

        doc.moveDown(0.8);
      });
    });
  }

  const range = doc.bufferedPageRange();
  for (let pageIndex = 0; pageIndex < range.count; pageIndex += 1) {
    doc.switchToPage(pageIndex);
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor('#64748b')
      .text(
        `This report follows the CAHPI/OAHI Standards of Practice. Page ${pageIndex + 1} of ${range.count}`,
        doc.page.margins.left,
        doc.page.height - doc.page.margins.bottom + 8,
        {
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
          align: 'center',
        },
      );
  }

  doc.end();
  return bufferPromise;
}

export const inspectionsRouter = Router();

inspectionsRouter.get('/', async (req, res) => {
  try {
    const authorIdParam =
      typeof req.query.authorId === 'string' ? req.query.authorId.trim() : undefined;
    const statusParam = typeof req.query.status === 'string' ? req.query.status.trim() : undefined;

    if (authorIdParam && !isValidObjectId(authorIdParam)) {
      return res.status(400).json({ error: 'Invalid authorId' });
    }

    if (statusParam && !inspectionStatusValues.includes(statusParam as InspectionStatus)) {
      return res.status(400).json({ error: 'Invalid status filter' });
    }

    await dbConnect();

    const query: {
      authorId?: mongoose.Types.ObjectId;
      status?: InspectionStatus;
    } = {};

    if (authorIdParam) {
      query.authorId = new mongoose.Types.ObjectId(authorIdParam);
    }

    if (statusParam) {
      query.status = statusParam as InspectionStatus;
    }

    const inspections = await Inspection.find(query).sort({ updatedAt: -1, createdAt: -1 }).lean();

    return res.json({ inspections });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return res.status(500).json({ error: message });
  }
});

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

    const authorId =
      payload.authorId && isValidObjectId(payload.authorId)
        ? new mongoose.Types.ObjectId(payload.authorId)
        : undefined;

    const inspection = await Inspection.create({
      authorId,
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

    let author: PdfAuthor = null;
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
                  ${renderFindingNarrativeHtml(finding, 'mt-1')}
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
                            ${renderFindingNarrativeHtml(finding, 'mt-2')}

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

    let pdfBuffer: Buffer;

    try {
      const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        ...(executablePath ? { executablePath } : {}),
      });

      const page = await browser.newPage();
      await page.setContent(reportHtml, { waitUntil: 'networkidle0' });

      const puppeteerPdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', bottom: '40px' },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate:
          "<div style='font-size:10px; width:100%; text-align:center; color:#64748b;'>This report follows the CAHPI/OAHI Standards of Practice.</div>",
      });

      pdfBuffer = Buffer.from(puppeteerPdfBuffer);
    } catch (pdfError) {
      if (browser) {
        await browser.close();
        browser = null;
      }

      console.error('Falling back to PDFKit after Puppeteer failure:', pdfError);
      pdfBuffer = await buildFallbackPdfBuffer(inspection, author);
    }

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

inspectionsRouter.patch('/:id/finalize', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid inspection id' });
    }

    await dbConnect();

    const existingInspection = await Inspection.findById(id);
    if (!existingInspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    if (existingInspection.status === 'Finalized') {
      return res.json({ inspection: existingInspection });
    }

    existingInspection.status = 'Finalized';
    existingInspection.expiresAt = null;
    await existingInspection.save();

    return res.json({ inspection: existingInspection });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return res.status(500).json({ error: message });
  }
});

// Optional safety net: allow a brief post-finalization revert window.
inspectionsRouter.patch('/:id/revert', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid inspection id' });
    }

    await dbConnect();

    const existingInspection = await Inspection.findById(id);
    if (!existingInspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    if (existingInspection.status !== 'Finalized') {
      return res.status(400).json({ error: 'Inspection is already in draft mode' });
    }

    const finalizedAt = existingInspection.updatedAt
      ? new Date(existingInspection.updatedAt).getTime()
      : 0;
    const elapsedMs = Date.now() - finalizedAt;

    if (!finalizedAt || elapsedMs > finalizeRevertWindowMs) {
      return res.status(403).json({ error: 'Revert window has expired for this inspection' });
    }

    existingInspection.status = 'Draft';
    existingInspection.expiresAt = getDraftExpiryDate();
    await existingInspection.save();

    return res.json({ inspection: existingInspection });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return res.status(500).json({ error: message });
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

    const existingInspection = await Inspection.findById(id);
    if (!existingInspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    if (existingInspection.status === 'Finalized') {
      return res.status(403).json({ error: 'Finalized inspections are locked for editing' });
    }

    const payload = parseResult.data;

    if (payload.status !== 'Draft') {
      return res.status(400).json({ error: 'Use /finalize to finalize an inspection report' });
    }

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

    return res.json({ inspection });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return res.status(500).json({ error: message });
  }
});
