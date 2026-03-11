'use client';

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';
import { apiFetch } from '@/lib/api';
import type {
  CannedComment,
  FindingUrgency,
  InspectionDocument,
  InspectionFinding,
  InspectionSection,
} from '@/lib/inspection';

type InspectionWorkspaceProps = {
  inspectionId: string;
};

type InspectionResponse = {
  inspection: InspectionDocument;
};

type SaveMode = 'manual' | 'auto';

type FindingDraft = {
  component: string;
  condition: string;
  implication: string;
  recommendation: string;
  urgency: FindingUrgency;
};

const initialFindingDraft: FindingDraft = {
  component: '',
  condition: '',
  implication: '',
  recommendation: '',
  urgency: 'Maintenance',
};

function getSectionCompleteState(section: InspectionSection) {
  return !section.isApplicable || section.findings.length > 0;
}

function StatusMarker({ completed }: Readonly<{ completed: boolean }>) {
  return completed ? (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-sm text-emerald-300">
      ✓
    </span>
  ) : (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-sm text-slate-300">
      ○
    </span>
  );
}

export function InspectionWorkspace({ inspectionId }: Readonly<InspectionWorkspaceProps>) {
  const [inspection, setInspection] = useState<InspectionDocument | null>(null);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isFindingModalOpen, setIsFindingModalOpen] = useState(false);
  const [findingDraft, setFindingDraft] = useState<FindingDraft>(initialFindingDraft);
  const [draftImageUrls, setDraftImageUrls] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [cannedComments, setCannedComments] = useState<CannedComment[]>([]);
  const [cannedSearch, setCannedSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedSection = inspection?.sections[selectedSectionIndex] ?? null;

  useEffect(() => {
    async function loadInspection() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await apiFetch<InspectionResponse>(`/inspections/${inspectionId}`);
        setInspection(response.inspection);
        setSelectedSectionIndex(0);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to load inspection.';
        setLoadError(message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadInspection();
  }, [inspectionId]);

  useEffect(() => {
    async function loadCannedComments() {
      try {
        const response = await apiFetch<{ comments: CannedComment[] }>('/comments');
        setCannedComments(response.comments);
      } catch {
        // Non-critical: if canned comments fail to load the inspector can still type manually
      }
    }

    void loadCannedComments();
  }, []);

  const saveProgress = useCallback(
    async (mode: SaveMode) => {
      if (!inspection) {
        return;
      }

      setIsSaving(true);

      try {
        const response = await apiFetch<InspectionResponse>(`/inspections/${inspection._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            propertyAddress: inspection.propertyAddress,
            propertyType: inspection.propertyType,
            status: inspection.status,
            sections: inspection.sections,
          }),
        });

        setInspection(response.inspection);
        setIsDirty(false);

        if (mode === 'manual') {
          setSaveMessage('Progress saved successfully.');
        } else {
          setSaveMessage(`Auto-saved at ${new Date().toLocaleTimeString()}.`);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to save progress.';
        setSaveMessage(message);
      } finally {
        setIsSaving(false);
      }
    },
    [inspection],
  );

  useEffect(() => {
    const intervalId = globalThis.setInterval(() => {
      if (!isDirty || !inspection || isSaving) {
        return;
      }

      void saveProgress('auto');
    }, 30_000);

    return () => {
      globalThis.clearInterval(intervalId);
    };
  }, [inspection, isDirty, isSaving, saveProgress]);

  function updateSection(
    index: number,
    updater: (section: InspectionSection) => InspectionSection,
  ) {
    setInspection((previous) => {
      if (!previous) {
        return previous;
      }

      const nextSections = previous.sections.map((section, sectionIndex) => {
        if (sectionIndex !== index) {
          return section;
        }

        return updater(section);
      });

      return {
        ...previous,
        sections: nextSections,
      };
    });
    setIsDirty(true);
  }

  function addFindingToSelectedSection(finding: InspectionFinding) {
    if (!selectedSection) {
      return;
    }

    updateSection(selectedSectionIndex, (section) => ({
      ...section,
      findings: [...section.findings, finding],
    }));
  }

  function handleFindingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    addFindingToSelectedSection({
      component: findingDraft.component.trim(),
      condition: findingDraft.condition.trim(),
      implication: findingDraft.implication.trim(),
      recommendation: findingDraft.recommendation.trim(),
      urgency: findingDraft.urgency,
      imageUrls: draftImageUrls,
    });

    setFindingDraft(initialFindingDraft);
    setDraftImageUrls([]);
    setUploadError('');
    setCannedSearch('');
    setIsFindingModalOpen(false);
  }

  function applyCannedComment(comment: CannedComment) {
    setFindingDraft((previous) => ({
      ...previous,
      condition: comment.condition,
      implication: comment.implication,
      recommendation: comment.recommendation,
    }));
    setCannedSearch('');
  }

  async function handleImageFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadError('');
    setIsUploadingImage(true);

    try {
      for (const file of Array.from(files)) {
        const compressed = await imageCompression(file, {
          maxWidthOrHeight: 1200,
          initialQuality: 0.8,
          useWebWorker: true,
        });

        const formData = new FormData();
        formData.append('image', compressed, compressed.name);

        const result = await apiFetch<{ url: string }>('/upload-image', {
          method: 'POST',
          body: formData,
        });

        setDraftImageUrls((previous) => [...previous, result.url]);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Image upload failed.';
      setUploadError(message);
    } finally {
      setIsUploadingImage(false);
      // Reset file input so the same file can be re-selected after removal
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function removeImageUrl(url: string) {
    setDraftImageUrls((previous) => previous.filter((u) => u !== url));
  }

  const filteredCannedComments = useMemo(() => {
    const query = cannedSearch.trim().toLowerCase();
    if (!query) return [];
    return cannedComments.filter(
      (c) => c.title.toLowerCase().includes(query) || c.category.toLowerCase().includes(query),
    );
  }, [cannedComments, cannedSearch]);

  const summaryCounts = useMemo(() => {
    const totalSections = inspection?.sections.length ?? 0;
    const completedSections = inspection?.sections.filter((section) =>
      getSectionCompleteState(section),
    ).length;

    return {
      totalSections,
      completedSections,
    };
  }, [inspection]);

  if (isLoading) {
    return <p className="text-slate-300">Loading inspection workspace...</p>;
  }

  if (loadError || !inspection) {
    return <p className="text-rose-300">{loadError ?? 'Inspection not found.'}</p>;
  }

  return (
    <div className="grid gap-5 md:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-slate-700 bg-slate-900/90 p-4 md:sticky md:top-24 md:h-[calc(100vh-7rem)] md:overflow-y-auto">
        <div className="space-y-1">
          <p className="text-xs tracking-[0.2em] text-slate-400 uppercase">Inspection Progress</p>
          <h2 className="text-base font-semibold text-white">
            {summaryCounts.completedSections}/{summaryCounts.totalSections} sections complete
          </h2>
        </div>

        <div className="mt-4 space-y-2">
          {inspection.sections.map((section, index) => {
            const selected = index === selectedSectionIndex;

            return (
              <button
                key={section.title}
                type="button"
                onClick={() => setSelectedSectionIndex(index)}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                  selected
                    ? 'border-indigo-400 bg-indigo-500/10 text-white'
                    : 'border-slate-700 bg-slate-950/70 text-slate-200 hover:border-slate-500'
                }`}
              >
                <span>{section.title}</span>
                <StatusMarker completed={getSectionCompleteState(section)} />
              </button>
            );
          })}
        </div>

        <div className="mt-5 border-t border-slate-700 pt-4">
          <button
            type="button"
            onClick={() => void saveProgress('manual')}
            disabled={isSaving}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? 'Saving...' : 'Save Progress'}
          </button>
          <p className="mt-2 min-h-5 text-xs text-slate-300">{saveMessage}</p>
        </div>
      </aside>

      <section className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5 md:p-6">
        <div className="space-y-1">
          <p className="text-xs tracking-[0.2em] text-slate-400 uppercase">Active Section</p>
          <h2 className="text-2xl font-semibold text-white">{selectedSection?.title}</h2>
          <p className="text-sm text-slate-300">Property: {inspection.propertyAddress}</p>
        </div>

        <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-100">Is this section applicable?</p>
            <button
              type="button"
              role="switch"
              aria-checked={selectedSection?.isApplicable ?? false}
              onClick={() => {
                if (!selectedSection) {
                  return;
                }

                updateSection(selectedSectionIndex, (section) => ({
                  ...section,
                  isApplicable: !section.isApplicable,
                }));
              }}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                selectedSection?.isApplicable ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                  selectedSection?.isApplicable ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {!selectedSection?.isApplicable ? (
            <div className="mt-4">
              <label
                className="block text-sm font-medium text-slate-200"
                htmlFor="exclusion-reason"
              >
                Reason for Exclusion
              </label>
              <textarea
                id="exclusion-reason"
                value={selectedSection?.limitations ?? ''}
                onChange={(event) => {
                  updateSection(selectedSectionIndex, (section) => ({
                    ...section,
                    limitations: event.target.value,
                  }));
                }}
                rows={4}
                className="mt-2 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
                placeholder="Explain why this section is not applicable for this property."
              />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-100">Findings</h3>
                <button
                  type="button"
                  onClick={() => setIsFindingModalOpen(true)}
                  className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
                >
                  Add Finding
                </button>
              </div>

              {selectedSection?.findings.length ? (
                <ul className="space-y-2">
                  {selectedSection.findings.map((finding, index) => (
                    <li
                      key={`${finding.component}-${index}`}
                      className="rounded-lg border border-slate-700 bg-slate-900 p-3"
                    >
                      <p className="text-sm font-semibold text-white">{finding.component}</p>
                      <p className="mt-1 text-xs text-slate-300">Condition: {finding.condition}</p>
                      <p className="mt-1 text-xs text-slate-300">
                        Implication: {finding.implication}
                      </p>
                      <p className="mt-1 text-xs text-slate-300">
                        Recommendation: {finding.recommendation}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-amber-300">
                        Urgency: {finding.urgency}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-300">No findings yet for this section.</p>
              )}
            </div>
          )}
        </div>
      </section>

      {isFindingModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
          <button
            type="button"
            aria-label="Close finding modal"
            className="absolute inset-0 h-full w-full"
            onClick={() => {
              setIsFindingModalOpen(false);
              setCannedSearch('');
              setDraftImageUrls([]);
              setUploadError('');
            }}
          />

          <div className="relative z-10 w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold text-white">Add Finding</h3>
              <button
                type="button"
                onClick={() => {
                  setIsFindingModalOpen(false);
                  setCannedSearch('');
                  setDraftImageUrls([]);
                  setUploadError('');
                }}
                className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:border-slate-400"
              >
                Close
              </button>
            </div>

            {cannedComments.length > 0 ? (
              <div className="mt-4">
                <label className="block text-sm text-slate-200" htmlFor="canned-search">
                  Quick-fill from canned comments
                </label>
                <div className="relative mt-1">
                  <input
                    id="canned-search"
                    type="search"
                    placeholder="Search by title or category (e.g. Electrical, GFCI…)"
                    value={cannedSearch}
                    onChange={(event) => setCannedSearch(event.target.value)}
                    className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
                    autoComplete="off"
                  />
                  {filteredCannedComments.length > 0 ? (
                    <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-slate-600 bg-slate-900 shadow-lg">
                      {filteredCannedComments.map((comment) => (
                        <li key={comment._id}>
                          <button
                            type="button"
                            onClick={() => applyCannedComment(comment)}
                            className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-slate-800"
                          >
                            <span className="font-semibold text-white">{comment.title}</span>
                            <span className="text-xs text-slate-400">{comment.category}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                {cannedSearch && filteredCannedComments.length === 0 ? (
                  <p className="mt-1 text-xs text-slate-400">
                    No matches — fill in the fields manually below.
                  </p>
                ) : null}
              </div>
            ) : null}

            <form onSubmit={handleFindingSubmit} className="mt-4 space-y-3">
              <label className="block text-sm text-slate-200">
                Component
                <input
                  required
                  value={findingDraft.component}
                  onChange={(event) =>
                    setFindingDraft((previous) => ({ ...previous, component: event.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
                />
              </label>

              <label className="block text-sm text-slate-200">
                Condition
                <textarea
                  required
                  rows={2}
                  value={findingDraft.condition}
                  onChange={(event) =>
                    setFindingDraft((previous) => ({ ...previous, condition: event.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
                />
              </label>

              <label className="block text-sm text-slate-200">
                Implication
                <textarea
                  required
                  rows={2}
                  value={findingDraft.implication}
                  onChange={(event) =>
                    setFindingDraft((previous) => ({
                      ...previous,
                      implication: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
                />
              </label>

              <label className="block text-sm text-slate-200">
                Recommendation
                <textarea
                  required
                  rows={2}
                  value={findingDraft.recommendation}
                  onChange={(event) =>
                    setFindingDraft((previous) => ({
                      ...previous,
                      recommendation: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
                />
              </label>

              <label className="block text-sm text-slate-200">
                Urgency
                <select
                  value={findingDraft.urgency}
                  onChange={(event) =>
                    setFindingDraft((previous) => ({
                      ...previous,
                      urgency: event.target.value as FindingUrgency,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
                >
                  <option value="Safety">Safety</option>
                  <option value="Major">Major</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </label>

              <div>
                <p className="text-sm text-slate-200">Images (optional)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => void handleImageFileChange(event)}
                  disabled={isUploadingImage}
                  className="mt-1 w-full text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-100 hover:file:bg-slate-600 disabled:opacity-60"
                />
                {isUploadingImage ? (
                  <p className="mt-1 text-xs text-slate-400">Compressing and uploading…</p>
                ) : null}
                {uploadError ? <p className="mt-1 text-xs text-rose-300">{uploadError}</p> : null}
                {draftImageUrls.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {draftImageUrls.map((url) => (
                      <div key={url} className="group relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt="Uploaded finding evidence"
                          className="h-16 w-16 rounded-md border border-slate-600 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImageUrl(url)}
                          aria-label="Remove image"
                          className="absolute -top-1 -right-1 hidden h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-xs text-white group-hover:flex"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={isUploadingImage}
                className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Add Finding
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
