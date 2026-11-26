"use client";

import { useEffect, useRef, useState } from "react";
import { FORMATS, GOALS, NICHES } from "@/lib/engine/types";
import { track } from "@/lib/analytics";
import { answersQuery, cleanHandle, pickIdeas, previewTitle, QUESTIONS, type Answers, type Idea } from "@/lib/preview";
import { Accent, Button, Chip, Eyebrow, Field, Input, Panel, Slots, cn } from "../ui/kit";
import { cardBlob, renderCard } from "./card-image";

type Picked = Partial<Pick<Answers, "niche" | "goal" | "format">>;

const STEP_NAMES = ["niche", "goal", "format"] as const;

/**
 * The free preview. Three questions, then three post ideas from CREO's pattern library and a card to share.
 * It never looks at an account: the handle (optional) is drawn on the card on this device and goes nowhere else.
 * `initial` is set when someone opens a shared link; the link carries the three answers and nothing else.
 */
export function PreviewTool({ initial }: { initial: Pick<Answers, "niche" | "goal" | "format"> | null }) {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<Picked>({});
  const [done, setDone] = useState<Pick<Answers, "niche" | "goal" | "format"> | null>(initial);
  const [viaLink, setViaLink] = useState(initial !== null);
  const [handleText, setHandleText] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  // Keep keyboard and screen-reader users in the right place when the step or the result changes.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    heading.current?.focus();
  }, [step, done]);

  useEffect(() => {
    if (initial) track("preview_result", { niche: initial.niche, goal: initial.goal, format: initial.format, via_link: true });
  }, [initial]);

  function choose(key: (typeof STEP_NAMES)[number], value: string) {
    const next = { ...picked, [key]: value } as Picked;
    setPicked(next);
    track("preview_answer", { step: key, choice: value });
    window.setTimeout(() => {
      if (step < 2) { setStep(step + 1); return; }
      const a = next as Pick<Answers, "niche" | "goal" | "format">;
      setViaLink(false);
      setDone(a);
      track("preview_result", { niche: a.niche, goal: a.goal, format: a.format, via_link: false });
    }, 170);
  }

  function restart() {
    setPicked({});
    setStep(0);
    setDone(null);
    setViaLink(false);
  }

  if (done) {
    return <Results answers={done} handleText={handleText} setHandleText={setHandleText} viaLink={viaLink} onRestart={restart} headingRef={heading} />;
  }

  const q = QUESTIONS[step];
  return (
    <div className="mx-auto w-full max-w-[44rem] px-5 pb-24 pt-10 sm:px-6 lg:pt-16">
      <Eyebrow className="mb-5">Free post ideas</Eyebrow>
      <h2 ref={heading} tabIndex={-1} className="font-display text-[clamp(2.1rem,5vw,3.5rem)] font-normal leading-[1.04] tracking-[-0.04em] outline-none">
        {step === 0 ? <>What should you post <Accent>next?</Accent></> : q.title}
      </h2>
      <p className="mt-4 text-[1.0625rem] leading-relaxed text-muted">
        {step === 0 ? "Three questions, three ideas picked from CREO's pattern library. Free, and it takes under a minute." : `Question ${step + 1} of 3`}
      </p>
      {step === 0 && <p className="mt-8 text-[0.9375rem] font-medium text-ink">{q.title}</p>}
      <div role="radiogroup" aria-label={q.title} className={cn("grid grid-cols-2 gap-2.5", step === 0 ? "mt-3" : "mt-8")}>
        {q.options.map((o) => {
          const on = picked[q.key] === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => choose(q.key, o.value)}
              className={cn(
                "flex min-h-14 items-center rounded-control border px-3.5 py-3 text-left text-[0.9375rem] font-medium leading-snug transition active:translate-y-px sm:px-4",
                on ? "border-ink bg-ink text-bg" : "border-line-strong bg-raised text-ink hover:bg-sunk",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {step > 0 && (
        <div className="mt-6">
          <Button variant="quiet" size="sm" onClick={() => setStep(step - 1)}>Back</Button>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-0.5 text-[0.9375rem] leading-snug text-ink">{value}</dd>
    </div>
  );
}

function IdeaCard({ idea, index }: { idea: Idea; index: number }) {
  return (
    <Panel as="article" className="p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <span className="font-display text-lg text-accent">{String(index + 1).padStart(2, "0")}</span>
        <Chip tone="lime">{idea.hookLabel}</Chip>
        {idea.fitsFormat && <Chip tone="ok">Fits how you film</Chip>}
      </div>
      <p className="mt-3 font-display text-[1.375rem] leading-snug tracking-[-0.02em] sm:text-[1.625rem]"><Slots text={idea.line} /></p>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-body">{idea.why}</p>
      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4">
        <Detail label="Open with" value={idea.openWith} />
        <Detail label="Length" value={idea.length} />
        <Detail label="End with" value={idea.endWith} />
        <Detail label="Usually shot as" value={idea.shotAs} />
      </dl>
    </Panel>
  );
}

function Results({
  answers, handleText, setHandleText, viaLink, onRestart, headingRef,
}: {
  answers: Pick<Answers, "niche" | "goal" | "format">;
  handleText: string;
  setHandleText: (v: string) => void;
  viaLink: boolean;
  onRestart: () => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const handle = cleanHandle(handleText);
  const full: Answers = { ...answers, handle };
  const ideas = pickIdeas(full);
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");

  // Redraw the card when the ideas or the handle change. Drawn on this device; nothing is uploaded.
  useEffect(() => {
    let alive = true;
    const t = window.setTimeout(async () => {
      const c = await renderCard(full, ideas);
      if (alive) setCardUrl(c.toDataURL("image/png"));
    }, 200);
    return () => { alive = false; window.clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers.niche, answers.goal, answers.format, handle]);

  const link = () => `${window.location.origin}/preview?${answersQuery(answers)}`;
  const flash = (m: string) => { setNote(m); window.setTimeout(() => setNote(""), 2400); };

  async function makeFile(): Promise<File | null> {
    const blob = await cardBlob(await renderCard(full, ideas));
    return blob ? new File([blob], "creo-post-ideas.png", { type: "image/png" }) : null;
  }

  async function download() {
    const file = await makeFile();
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
    track("preview_share", { action: "download", has_handle: !!handle });
    flash("Card saved.");
  }

  async function copy() {
    try { await navigator.clipboard.writeText(link()); flash("Link copied."); } catch { flash("Copy failed. Select the address bar instead."); }
    track("preview_share", { action: "copy", has_handle: !!handle });
  }

  async function share() {
    const file = await makeFile();
    const data: ShareData = { title: previewTitle(answers), text: "3 post ideas from CREO", url: link() };
    try {
      if (file && navigator.canShare?.({ files: [file] })) await navigator.share({ ...data, files: [file] });
      else if (navigator.share) await navigator.share(data);
      else { await copy(); return; }
      track("preview_share", { action: "share", has_handle: !!handle });
    } catch { /* the visitor closed the share sheet */ }
  }

  return (
    <div className="mx-auto w-full max-w-[44rem] px-5 pb-24 pt-10 sm:px-6 lg:pt-16">
      {viaLink && (
        <Panel className="mb-8 flex flex-col gap-3 bg-sunk p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.9375rem] text-body">Someone shared these ideas with you. Want your own? It takes three questions.</p>
          <Button variant="dark" size="sm" onClick={onRestart}>Get my own ideas</Button>
        </Panel>
      )}
      <Eyebrow className="mb-5">Free post ideas</Eyebrow>
      <h2 ref={headingRef} tabIndex={-1} className="font-display text-[clamp(2rem,4.6vw,3.25rem)] font-normal leading-[1.04] tracking-[-0.04em] outline-none">
        3 post ideas for <Accent>{NICHES[answers.niche].label}</Accent> creators
      </h2>
      <p className="mt-4 text-[1.0625rem] leading-relaxed text-muted">
        Picked for {GOALS[answers.goal].toLowerCase()}, filming {FORMATS[answers.format].toLowerCase()}. They come from CREO's hand-picked pattern library. Nothing here looks at your account.
      </p>

      <div className="ph-mask mt-8 flex flex-col gap-4">
        {ideas.map((idea, i) => <IdeaCard key={idea.id} idea={idea} index={i} />)}
      </div>
      <p className="mt-3 text-[0.8125rem] text-muted">Anything highlighted is for you to fill in. CREO never invents a result.</p>

      <Panel as="section" className="mt-10 p-5 sm:p-6">
        <h3 className="font-display text-xl font-semibold tracking-[-0.02em]">Share these ideas</h3>
        <p className="mt-1 text-[0.9375rem] text-muted">A card you can post or send. Add your handle if you want it on the card; it stays on this device.</p>
        <div className="mt-4 grid gap-5 sm:grid-cols-[minmax(0,13rem)_1fr] sm:items-start">
          <div className="overflow-hidden rounded-control border border-line bg-sunk">
            {cardUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cardUrl} alt={`Share card with the three ${NICHES[answers.niche].label} post ideas`} width={1080} height={1350} className="block h-auto w-full" />
            ) : (
              <div className="aspect-[4/5] w-full animate-pulse bg-sunk" aria-hidden />
            )}
          </div>
          <div className="flex flex-col gap-4">
            <Field label="Your handle (optional)" hint="Letters, numbers, dots and underscores. Only drawn on the card.">
              <Input
                value={handleText}
                onChange={(e) => setHandleText(e.target.value)}
                placeholder="@yourhandle"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={60}
                className="ph-no-capture"
              />
            </Field>
            {handleText.trim() !== "" && !handle && <p className="-mt-2 text-xs text-risk">Use letters, numbers, dots and underscores only.</p>}
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" size="md" onClick={share}>Share</Button>
              <Button variant="ghost" size="md" onClick={download}>Download card</Button>
              <Button variant="ghost" size="md" onClick={copy}>Copy link</Button>
            </div>
            <p role="status" aria-live="polite" className="min-h-5 text-[0.8125rem] text-muted">{note}</p>
          </div>
        </div>
      </Panel>

      <Panel as="section" className="mt-6 p-5 sm:p-6">
        <h3 className="font-display text-xl font-semibold tracking-[-0.02em]">Want to test them for 30 days?</h3>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-body">
          The 30-Day Founding Cohort is ₹499 for 30 days, with limited seats. CREO learns which hooks and formats work for your audience, and a strategist works alongside it. You approve every post.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button href="/cohort#apply" variant="primary" size="lg" data-track="join_cohort" data-track-where="preview">Join the 30-Day Founding Cohort</Button>
          <Button variant="quiet" size="md" onClick={onRestart}>Start over</Button>
        </div>
      </Panel>

      <p className="mt-8 text-[0.8125rem] leading-relaxed text-muted">These are starting points, not a promise of results. Try one, then see what happens to your own numbers.</p>
    </div>
  );
}
