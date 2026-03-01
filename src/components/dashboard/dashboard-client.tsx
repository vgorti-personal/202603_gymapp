"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Clock3,
  CloudSun,
  ExternalLink,
  Fullscreen,
  Home,
  Music2,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Settings,
  SlidersHorizontal,
} from "lucide-react";

import { Panel } from "@/components/ui/panel";
import type { DashboardPayload, SpotifyNowPlaying, WorkoutSource } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  filterTemplates,
  WORKOUT_GOALS,
  WORKOUT_SPLITS,
} from "@/lib/workout-templates";

type DashboardClientProps = {
  slug: string;
};

type EditableWorkoutSource = {
  sourceType: "google_sheet" | "template";
  publishUrl: string;
  editUrl: string;
  goal: string;
  split: string;
  templateId: string;
};

const GOAL_LABELS: Record<string, string> = {
  flexibility: "Flexibility",
  maintenance: "Maintenance",
  strength: "Heavy Lifting / Strength",
  olympic: "Olympic Lifting",
  hypertrophy: "Hypertrophy",
};

const SPLIT_LABELS: Record<string, string> = {
  push_pull_legs: "Push / Pull / Legs",
  upper_lower: "Upper / Lower",
  full_body: "Full Body",
  five_by_five: "5x5",
  olympic_technique: "Olympic Technique",
};

function toEditableWorkoutSource(source: WorkoutSource | null): EditableWorkoutSource {
  if (source?.sourceType === "google_sheet") {
    return {
      sourceType: "google_sheet",
      publishUrl: source.publishUrl ?? "",
      editUrl: source.editUrl ?? "",
      goal: "maintenance",
      split: "full_body",
      templateId: "maintenance-full-body-3x",
    };
  }

  return {
    sourceType: "template",
    publishUrl: "",
    editUrl: "",
    goal: source?.goal ?? "maintenance",
    split: source?.split ?? "full_body",
    templateId: source?.templateId ?? "maintenance-full-body-3x",
  };
}

function ClockWeatherPanel({
  timezone,
  weather,
}: {
  timezone: string;
  weather: DashboardPayload["weather"];
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatted = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: timezone,
      }).format(now),
    [now, timezone],
  );

  return (
    <Panel title="Clock + Weather" subtitle="Quick glance">
      <div className="space-y-3">
        <div className="rounded-xl bg-slate-900/80 p-3">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-300">
            <Clock3 size={14} /> Local Time
          </p>
          <p className="mt-1 text-xl font-semibold text-white">{formatted}</p>
          <p className="mt-1 text-xs text-slate-300">{timezone}</p>
        </div>

        <div className="rounded-xl bg-slate-900/80 p-3">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-300">
            <CloudSun size={14} /> Weather
          </p>
          {weather ? (
            <p className="mt-1 text-sm text-white">
              {weather.city}: {weather.temperatureC}C, {weather.weatherDescription} (H {weather.highC} / L{" "}
              {weather.lowC})
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-300">Weather unavailable.</p>
          )}
        </div>
      </div>
    </Panel>
  );
}

function formatSeconds(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (totalSeconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function readTimerState(storageKey: string) {
  if (typeof window === "undefined") {
    return { seconds: 120, running: false };
  }
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return { seconds: 120, running: false };
  }
  try {
    return JSON.parse(raw) as { seconds: number; running: boolean };
  } catch {
    window.localStorage.removeItem(storageKey);
    return { seconds: 120, running: false };
  }
}

function RestTimerWidget({ storageKey }: { storageKey: string }) {
  const [initialState] = useState(() => readTimerState(storageKey));
  const [seconds, setSeconds] = useState(initialState.seconds);
  const [running, setRunning] = useState(initialState.running);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ seconds, running }));
  }, [running, seconds, storageKey]);

  useEffect(() => {
    if (!running) {
      return;
    }
    const id = setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          setRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  return (
    <Panel title="Rest Timer" subtitle="Set-to-set timing">
      <div className="space-y-3">
        <div className="rounded-xl bg-slate-900/80 p-3">
          <p className="text-3xl font-semibold text-emerald-300">{formatSeconds(seconds)}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[60, 90, 120].map((value) => (
            <button
              className="rounded-lg border border-white/15 bg-slate-900 px-2 py-1 text-xs text-slate-200 hover:border-emerald-300/40"
              key={value}
              onClick={() => {
                setSeconds(value);
                setRunning(false);
              }}
              type="button"
            >
              {value / 60} min
            </button>
          ))}
        </div>

        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
          onClick={() => setRunning((current) => !current)}
          type="button"
        >
          {running ? <PauseCircle size={16} /> : <PlayCircle size={16} />} {running ? "Pause" : "Start"}
        </button>
      </div>
    </Panel>
  );
}

function SpotifyWidget({ linked, userId }: { linked: boolean; userId: string }) {
  const [state, setState] = useState<SpotifyNowPlaying>({
    linked,
    isPlaying: false,
    trackName: null,
    artistName: null,
    albumName: null,
    albumArtUrl: null,
    externalUrl: null,
    progressMs: null,
    durationMs: null,
  });

  const pullNowPlaying = useCallback(async () => {
    if (!linked) {
      return;
    }
    const response = await fetch(`/api/spotify/now-playing?userId=${encodeURIComponent(userId)}`);
    if (!response.ok) {
      return;
    }
    const payload = (await response.json()) as SpotifyNowPlaying;
    setState(payload);
  }, [linked, userId]);

  useEffect(() => {
    const kickoff = setTimeout(() => {
      pullNowPlaying().catch((error) => console.error(error));
    }, 0);
    const interval = setInterval(() => {
      pullNowPlaying().catch((error) => console.error(error));
    }, 20_000);
    return () => {
      clearTimeout(kickoff);
      clearInterval(interval);
    };
  }, [pullNowPlaying]);

  return (
    <Panel title="Spotify" subtitle="Now playing">
      {!linked ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">Spotify account is not linked for this user.</p>
          <a
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
            href={`/api/spotify/connect?userId=${encodeURIComponent(userId)}`}
          >
            Connect Spotify
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {state.trackName ? (
            <>
              {state.albumArtUrl ? (
                <Image
                  alt={state.albumName ?? "Album Art"}
                  className="h-36 w-full rounded-lg object-cover"
                  height={144}
                  src={state.albumArtUrl}
                  unoptimized
                  width={360}
                />
              ) : null}
              <div>
                <p className="text-sm font-semibold text-white">{state.trackName}</p>
                <p className="text-xs text-slate-300">{state.artistName}</p>
              </div>
              {state.externalUrl ? (
                <a
                  className="inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-sm text-slate-200 hover:border-emerald-300/40"
                  href={state.externalUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open in Spotify <ExternalLink size={14} />
                </a>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-slate-300">Nothing currently playing.</p>
          )}
        </div>
      )}
    </Panel>
  );
}

function WorkoutPanel({
  payload,
  frameKey,
  onManualRefreshSheet,
  sheetHeight,
  setSheetHeight,
  sheetZoom,
  setSheetZoom,
}: {
  payload: DashboardPayload;
  frameKey: number;
  onManualRefreshSheet: () => void;
  sheetHeight: number;
  setSheetHeight: (height: number) => void;
  sheetZoom: number;
  setSheetZoom: (zoom: number) => void;
}) {
  if (!payload.workoutSource) {
    return (
      <Panel className="h-full" title="Workout Plan" subtitle="No source configured">
        <p className="text-sm text-slate-300">Use workout source settings to connect a Google Sheet or select a template.</p>
      </Panel>
    );
  }

  if (payload.workoutSource.sourceType === "google_sheet" && payload.workoutSource.publishUrl) {
    const scale = sheetZoom / 100;
    return (
      <Panel
        className="flex h-full min-h-0 flex-col"
        subtitle="Live workout sheet view"
        title="Workout Sheet"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="inline-flex items-center gap-1 rounded-md border border-white/20 px-2 py-1 text-xs text-slate-100 hover:border-emerald-300/40"
              onClick={onManualRefreshSheet}
              type="button"
            >
              <RefreshCw size={12} /> Refresh
            </button>
            <select
              className="rounded-md border border-white/20 bg-slate-900 px-2 py-1 text-xs text-slate-100"
              onChange={(event) => setSheetHeight(Number(event.target.value))}
              value={sheetHeight}
            >
              {[560, 680, 760].map((value) => (
                <option key={value} value={value}>
                  Height {value}px
                </option>
              ))}
            </select>
            <select
              className="rounded-md border border-white/20 bg-slate-900 px-2 py-1 text-xs text-slate-100"
              onChange={(event) => setSheetZoom(Number(event.target.value))}
              value={sheetZoom}
            >
              {[85, 95, 100].map((value) => (
                <option key={value} value={value}>
                  Zoom {value}%
                </option>
              ))}
            </select>
          </div>
        }
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {payload.workoutSource.editUrl ? (
            <a
              className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
              href={payload.workoutSource.editUrl}
              rel="noreferrer"
              target="_blank"
            >
              Edit Workout Sheet <ExternalLink size={14} />
            </a>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-white/10 bg-white/95">
          <div
            style={{
              width: `${100 / scale}%`,
              height: `${sheetHeight / scale}px`,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <iframe
              className="h-full w-full"
              key={frameKey}
              src={payload.workoutSource.publishUrl}
              title="Workout Google Sheet"
            />
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="h-full overflow-auto" subtitle="Template-based workout plan" title={payload.workoutTemplate?.name ?? "Workout Plan"}>
      {payload.workoutTemplate ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-200">{payload.workoutTemplate.description}</p>
          {payload.workoutTemplate.days.map((day) => (
            <div className="rounded-lg border border-white/10 bg-slate-900/70 p-3" key={day.dayLabel}>
              <h3 className="text-sm font-semibold text-white">
                {day.dayLabel} - {day.focus}
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                {day.exercises.map((exercise) => (
                  <li key={exercise.name}>
                    {exercise.name} ({exercise.equipment}) - {exercise.sets} x {exercise.reps}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-300">Template details unavailable.</p>
      )}
    </Panel>
  );
}

function WorkoutSourceSettings({
  slug,
  current,
  onSaved,
}: {
  slug: string;
  current: EditableWorkoutSource;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState<EditableWorkoutSource>(current);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableTemplates = useMemo(() => {
    return filterTemplates(form.goal, form.split);
  }, [form.goal, form.split]);

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);

    const templateChoice =
      form.templateId && availableTemplates.some((template) => template.id === form.templateId)
        ? form.templateId
        : availableTemplates[0]?.id ?? "";

    const payload =
      form.sourceType === "google_sheet"
        ? {
            sourceType: "google_sheet",
            publishUrl: form.publishUrl,
            editUrl: form.editUrl,
          }
        : {
            sourceType: "template",
            goal: form.goal,
            split: form.split,
            templateId: templateChoice,
          };

    try {
      const response = await fetch(`/api/users/${slug}/workout-source`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const json = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(json?.error ?? "Unable to save workout source.");
        return;
      }
      setMessage("Workout source updated.");
      await onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title="Workout Source Settings" subtitle="Google Sheet or dropdown template flow">
      <div className="space-y-3">
        <label className="text-xs uppercase tracking-[0.14em] text-slate-300">Workout Source</label>
        <select
          className="w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white"
          onChange={(event) =>
            setForm({
              ...form,
              sourceType: event.target.value as "google_sheet" | "template",
            })
          }
          value={form.sourceType}
        >
          <option value="google_sheet">Google Sheet</option>
          <option value="template">Template Dropdowns</option>
        </select>

        {form.sourceType === "google_sheet" ? (
          <div className="space-y-2">
            <input
              className="w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white"
              onChange={(event) => setForm({ ...form, publishUrl: event.target.value })}
              placeholder="Published sheet URL"
              value={form.publishUrl}
            />
            <input
              className="w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white"
              onChange={(event) => setForm({ ...form, editUrl: event.target.value })}
              placeholder="Editable sheet URL"
              value={form.editUrl}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.14em] text-slate-300">General Exercise Type</label>
            <select
              className="w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white"
              onChange={(event) => {
                const nextGoal = event.target.value;
                const nextTemplates = filterTemplates(nextGoal, form.split);
                setForm({
                  ...form,
                  goal: nextGoal,
                  templateId: nextTemplates[0]?.id ?? "",
                });
              }}
              value={form.goal}
            >
              {WORKOUT_GOALS.map((goal) => (
                <option key={goal} value={goal}>
                  {GOAL_LABELS[goal] ?? goal}
                </option>
              ))}
            </select>

            <label className="text-xs uppercase tracking-[0.14em] text-slate-300">Plan Type</label>
            <select
              className="w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white"
              onChange={(event) => {
                const nextSplit = event.target.value;
                const nextTemplates = filterTemplates(form.goal, nextSplit);
                setForm({
                  ...form,
                  split: nextSplit,
                  templateId: nextTemplates[0]?.id ?? "",
                });
              }}
              value={form.split}
            >
              {WORKOUT_SPLITS.map((split) => (
                <option key={split} value={split}>
                  {SPLIT_LABELS[split] ?? split}
                </option>
              ))}
            </select>

            <label className="text-xs uppercase tracking-[0.14em] text-slate-300">Specific Workout</label>
            <select
              className="w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white"
              onChange={(event) => setForm({ ...form, templateId: event.target.value })}
              value={form.templateId}
            >
              {availableTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {message ? <p className="text-xs text-emerald-300">{message}</p> : null}
        {error ? <p className="text-xs text-red-300">{error}</p> : null}

        <button
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          disabled={saving}
          onClick={() => save().catch((saveError) => console.error(saveError))}
          type="button"
        >
          <SlidersHorizontal size={14} />
          {saving ? "Saving..." : "Save Workout Source"}
        </button>
      </div>
    </Panel>
  );
}

export function DashboardClient({ slug }: DashboardClientProps) {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [workoutForm, setWorkoutForm] = useState<EditableWorkoutSource>(() =>
    toEditableWorkoutSource(null),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kioskMode, setKioskMode] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem(`gym-dashboard-kiosk-${slug}`) === "1";
  });
  const [sheetFrameKey, setSheetFrameKey] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(680);
  const [sheetZoom, setSheetZoom] = useState(95);

  const refreshDashboard = useCallback(async () => {
    const response = await fetch(`/api/users/${slug}/dashboard`, { cache: "no-store" });
    if (!response.ok) {
      setError("Unable to load dashboard.");
      setLoading(false);
      return;
    }
    const payload = (await response.json()) as DashboardPayload;
    setData(payload);
    setWorkoutForm(toEditableWorkoutSource(payload.workoutSource));
    setLoading(false);
    setError(null);
  }, [slug]);

  useEffect(() => {
    const kickoff = setTimeout(() => {
      refreshDashboard().catch((pullError) => {
        console.error(pullError);
        setError("Unable to load dashboard.");
        setLoading(false);
      });
    }, 0);
    return () => clearTimeout(kickoff);
  }, [refreshDashboard]);

  useEffect(() => {
    if (!data?.workoutSource || data.workoutSource.sourceType !== "google_sheet") {
      return;
    }
    const interval = setInterval(() => setSheetFrameKey((current) => current + 1), 60_000);
    return () => clearInterval(interval);
  }, [data?.workoutSource]);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12">
        <p className="text-slate-200">Loading dashboard...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12">
        <p className="text-red-300">{error ?? "Dashboard unavailable."}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-5 lg:py-6">
      <header
        className={cn(
          "rounded-2xl border border-white/20 bg-slate-950/70 p-4 backdrop-blur",
          kioskMode ? "border-emerald-300/60" : "",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-emerald-300">Home Gym Dashboard</p>
            <h1 className="mt-1 text-3xl font-semibold text-white">{data.user.displayName}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm text-slate-100 hover:border-emerald-300/40"
              href="/"
            >
              <Home size={16} />
              Back to Home
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm text-slate-100 hover:border-emerald-300/40"
              href="/admin"
            >
              <Settings size={16} />
              Admin
            </Link>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
              onClick={() => {
                const next = !kioskMode;
                setKioskMode(next);
                localStorage.setItem(`gym-dashboard-kiosk-${slug}`, next ? "1" : "0");
              }}
              type="button"
            >
              <Fullscreen size={16} />
              {kioskMode ? "Exit Kiosk" : "Kiosk Mode"}
            </button>
          </div>
        </div>
      </header>

      <section className="mt-4 grid gap-4 lg:h-[calc(100vh-170px)] lg:grid-cols-[1.9fr_1fr]">
        <div className="min-h-0 lg:h-full">
          <WorkoutPanel
            frameKey={sheetFrameKey}
            onManualRefreshSheet={() => setSheetFrameKey((current) => current + 1)}
            payload={data}
            setSheetHeight={setSheetHeight}
            setSheetZoom={setSheetZoom}
            sheetHeight={sheetHeight}
            sheetZoom={sheetZoom}
          />
        </div>

        <div className="space-y-4 lg:min-h-0 lg:overflow-y-auto">
          <ClockWeatherPanel timezone={data.user.timezone} weather={data.weather} />
          <SpotifyWidget linked={data.spotifyLinked} userId={data.user.id} />
          <RestTimerWidget storageKey={`rest-timer-${slug}`} />
          <WorkoutSourceSettings
            key={`${workoutForm.sourceType}-${workoutForm.goal}-${workoutForm.split}-${workoutForm.templateId}-${workoutForm.publishUrl}-${workoutForm.editUrl}`}
            current={workoutForm}
            onSaved={refreshDashboard}
            slug={slug}
          />
          <Panel title="Status" subtitle="Current configuration">
            <div className="space-y-2 text-sm text-slate-200">
              <p className="flex items-center gap-2">
                <Music2 size={14} /> Spotify {data.spotifyLinked ? "linked" : "not linked"}
              </p>
              <p>Workout source: {data.workoutSource?.sourceType === "google_sheet" ? "Google Sheet" : "Template"}</p>
            </div>
          </Panel>
        </div>
      </section>
    </main>
  );
}
