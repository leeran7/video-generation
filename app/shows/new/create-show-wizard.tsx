"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { WizardState, INITIAL, STEPS, slugify } from "./wizard/types";
import { StepQuickStart } from "./wizard/step-quickstart";
import { StepConcept } from "./wizard/step-concept";
import { StepFormat } from "./wizard/step-format";
import { StepWorld } from "./wizard/step-world";
import { StepStyle } from "./wizard/step-style";
import { StepCast } from "./wizard/step-cast";
import { StepPlan } from "./wizard/step-plan";
import { Button } from "@/components/ui/atoms";
import { ApiClient } from "@/lib/api/client";

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({
  current,
  onNavigate,
}: {
  current: number;
  onNavigate: (i: number) => void;
}) {
  return (
    <div className="mb-10 flex items-center">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = done || active;
        return (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => clickable && onNavigate(i)}
                disabled={!clickable}
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold transition-colors disabled:cursor-default ${
                  active
                    ? "border-(--text) bg-(--text) text-(--bg)"
                    : done
                    ? "cursor-pointer border-[color-mix(in_srgb,var(--text)_40%,transparent)] bg-[color-mix(in_srgb,var(--text)_10%,transparent)] text-(--text) hover:border-(--text) hover:bg-[color-mix(in_srgb,var(--text)_20%,transparent)]"
                    : "border-(--border) text-(--muted)"
                }`}
              >
                {done ? "✓" : i + 1}
              </button>
              <span
                className={`hidden text-[9px] font-bold uppercase tracking-[0.2em] sm:block ${
                  active ? "text-(--text)" : done ? "cursor-pointer text-(--muted) hover:text-(--text)" : "text-(--muted)"
                }`}
                onClick={() => done && onNavigate(i)}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-1.5 mb-5 h-px w-6 sm:w-10 ${
                  done
                    ? "bg-[color-mix(in_srgb,var(--text)_40%,transparent)]"
                    : "bg-(--border)"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

const STEP_TITLES = [
  "Start with an idea",
  "What's your show about?",
  "How is it structured?",
  "What's the world like?",
  "What does it look like?",
  "Who are the characters?",
  "Review & plan",
];

const STEP_SUBTITLES = [
  "Describe an idea and let AI build the whole show — or configure it yourself step by step.",
  "Start with the core concept — the genre, tone, and the one-line premise everything builds from.",
  "Define the episode length and season structure. You can always adjust this later.",
  "Describe the world, then use AI to draft the series bible — or write it yourself.",
  "Choose the art style for character design sheets. This determines how AI renders your characters.",
  "Build your main cast. Use AI to generate a starting roster, then shape each character.",
  "Review your show and see the estimated production cost before creating it.",
];

export function CreateShowWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function set(patch: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...patch }));
  }

  // Called when AI generates everything — fill state and jump to Plan step
  function handleAiGenerated(data: Partial<WizardState>) {
    const title = data.title ?? "";
    setState((prev) => ({
      ...prev,
      ...data,
      slug: slugify(title),
    }));
    setStep(STEPS.length - 1); // jump to Plan
  }

  function canAdvance() {
    if (step === 0) return false; // QuickStart has its own buttons
    if (step === 1) return !!state.title.trim() && state.genres.length > 0;
    if (step === 3) return !!state.settingDescription.trim() || !!state.worldRules.trim();
    return true;
  }

  function advanceHint() {
    if (step === 1) return "Add a title and at least one genre to continue";
    if (step === 3) return "Add a setting or world rules to continue";
    return "";
  }

  async function handleSubmit() {
    setSubmitError("");
    setSubmitting(true);
    try {
      const api = new ApiClient();
      const { showSlug } = await api.createShow({
        title: state.title,
        logline: state.logline,
        genres: state.genres,
        tones: state.tones,
        videoScope: state.videoScope,
        episodeSeconds: state.episodeSeconds,
        totalEpisodes: state.videoScope === "single" ? 1 : state.totalEpisodes,
        platform: state.platform,
        settingDescription: state.settingDescription,
        worldRules: state.worldRules,
        visualStyle: state.visualStyle,
        thematicFocus: state.thematicFocus,
        draftCharacters: state.characters,
        designStyleId: state.designStyleId,
      });
      router.push(`/shows/${showSlug}`);
    } catch (err) {
      setSubmitError((err as Error).message);
      setSubmitting(false);
    }
  }

  const isLastStep = step === STEPS.length - 1;
  const isFirstStep = step === 0;

  return (
    <div className="mx-auto max-w-[860px] px-6 pb-24 pt-10">
      <div className="mb-8">
        <h1 className="mb-1 text-[clamp(28px,4vw,40px)] font-extrabold tracking-[-0.02em] text-(--text)">
          New show
        </h1>
        <p className="text-xs uppercase tracking-[0.15em] text-(--muted)">Studio</p>
      </div>

      <StepIndicator current={step} onNavigate={setStep} />

      <div className="mb-8">
        <h2 className="mb-1 text-xl font-bold tracking-[-0.01em] text-(--text)">
          {STEP_TITLES[step]}
        </h2>
        <p className="text-sm text-(--muted)">{STEP_SUBTITLES[step]}</p>
      </div>

      {step === 0 && (
        <StepQuickStart
          onGenerated={handleAiGenerated}
          onManual={() => setStep(1)}
        />
      )}
      {step === 1 && <StepConcept state={state} set={set} />}
      {step === 2 && <StepFormat state={state} set={set} />}
      {step === 3 && <StepWorld state={state} set={set} />}
      {step === 4 && <StepStyle state={state} set={set} />}
      {step === 5 && <StepCast state={state} set={set} />}
      {step === 6 && <StepPlan state={state} set={set} />}

      {/* Navigation — hidden on QuickStart (it manages its own buttons) */}
      {!isFirstStep && (
        <div className="mt-10 flex items-center justify-between border-t border-(--border) pt-6">
          <Button variant="ghost" type="button" onClick={() => setStep((s) => s - 1)}>
            ← Back
          </Button>

          <div className="flex flex-col items-end gap-1">
            {!isLastStep ? (
              <Button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canAdvance()}
              >
                Continue →
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Creating…" : "Create show →"}
              </Button>
            )}
            {!canAdvance() && !isLastStep && (
              <span className="text-[10px] text-(--muted)">{advanceHint()}</span>
            )}
            {submitError && (
              <span className="text-[11px] text-[#ff7466]">{submitError}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
