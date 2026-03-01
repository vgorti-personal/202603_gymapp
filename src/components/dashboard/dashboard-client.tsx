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
  SkipForward,
  SlidersHorizontal,
} from "lucide-react";

import { Panel } from "@/components/ui/panel";
import { pickDefaultSheetTab, toPublishedSheetTabUrl } from "@/lib/google-sheets";
import type { DashboardPayload, SheetTab, SpotifyNowPlaying, WorkoutSource } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  filterTemplates,
  getTemplateById,
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

const EMPTY_SPOTIFY_STATE: SpotifyNowPlaying = {
  linked: false,
  controllable: false,
  controlErrorCode: null,
  controlErrorMessage: null,
  isPlaying: false,
  trackName: null,
  artistName: null,
  albumName: null,
  albumArtUrl: null,
  externalUrl: null,
  progressMs: null,
  durationMs: null,
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

function formatMs(ms: number | null) {
  if (!ms || ms <= 0) {
    return "0:00";
  }
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = (totalSeconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
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
          <p className="mt-1 text-2xl font-semibold text-white">{formatted}</p>
          <p className="mt-1 text-xs text-slate-300">{timezone}</p>
        </div>

        <div className="rounded-xl bg-slate-900/80 p-3">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-300">
            <CloudSun size={14} /> Weather
          </p>
          {weather ? (
            <>
              <p className="mt-1 text-sm text-white">
                {weather.city}: {weather.temperatureC}C, {weather.weatherDescription} (H {weather.highC} / L{" "}
                {weather.lowC})
              </p>
              <p className="mt-1 text-xs text-slate-300">Requested: {weather.requestedCity}</p>
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-300">Weather unavailable for saved city.</p>
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
    ...EMPTY_SPOTIFY_STATE,
    linked,
    controllable: linked,
  });
  const [loading, setLoading] = useState(linked);
  const [acting, setActing] = useState(false);

  const pullNowPlaying = useCallback(async () => {
    if (!linked) {
      setState({ ...EMPTY_SPOTIFY_STATE, linked: false, controllable: false });
      setLoading(false);
      return;
    }
    const response = await fetch(`/api/spotify/now-playing?userId=${encodeURIComponent(userId)}`);
    if (!response.ok) {
      setLoading(false);
      return;
    }
    const payload = (await response.json()) as SpotifyNowPlaying;
    setState(payload);
    setLoading(false);
  }, [linked, userId]);

  async function runControl(action: "toggle_playback" | "next_track") {
    setActing(true);
    try {
      const response = await fetch("/api/spotify/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { errorCode?: SpotifyNowPlaying["controlErrorCode"]; errorMessage?: string }
          | null;
        setState((current) => ({
          ...current,
          controllable: false,
          controlErrorCode: payload?.errorCode ?? "unavailable",
          controlErrorMessage: payload?.errorMessage ?? "Spotify control unavailable.",
        }));
        return;
      }

      const payload = (await response.json()) as { ok: boolean; nowPlaying: SpotifyNowPlaying | null };
      if (payload.nowPlaying) {
        setState(payload.nowPlaying);
      } else {
        await pullNowPlaying();
      }
    } finally {
      setActing(false);
    }
  }

  useEffect(() => {
    const kickoff = setTimeout(() => {
      pullNowPlaying().catch((error) => console.error(error));
    }, 0);
    const interval = setInterval(() => {
      pullNowPlaying().catch((error) => console.error(error));
    }, 12_000);
    return () => {
      clearTimeout(kickoff);
      clearInterval(interval);
    };
  }, [pullNowPlaying]);

  useEffect(() => {
    if (!state.isPlaying || !state.progressMs || !state.durationMs) {
      return;
    }
    const interval = setInterval(() => {
      setState((current) => {
        if (!current.isPlaying || !current.progressMs || !current.durationMs) {
          return current;
        }
        return {
          ...current,
          progressMs: Math.min(current.progressMs + 1000, current.durationMs),
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state.isPlaying, state.progressMs, state.durationMs]);

  const progressPercent =
    state.progressMs && state.durationMs && state.durationMs > 0
      ? Math.min(100, Math.max(0, (state.progressMs / state.durationMs) * 100))
      : 0;

  return (
    <Panel title="Spotify" subtitle="Now playing + transport controls">
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
      ) : loading ? (
        <p className="text-sm text-slate-300">Loading Spotify status...</p>
      ) : (
        <div className="space-y-3">
          {state.trackName ? (
            <>
              {state.albumArtUrl ? (
                <Image
                  alt={state.albumName ?? "Album Art"}
                  className="h-32 w-full rounded-lg object-cover"
                  height={128}
                  src={state.albumArtUrl}
                  unoptimized
                  width={360}
                />
              ) : null}
              <div>
                <p className="text-sm font-semibold text-white">{state.trackName}</p>
                <p className="text-xs text-slate-300">{state.artistName}</p>
              </div>

              <div className="space-y-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-slate-300">
                  {formatMs(state.progressMs)} / {formatMs(state.durationMs)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 px-3 py-2 text-sm text-slate-100 hover:border-emerald-300/40 disabled:opacity-50"
                  disabled={acting}
                  onClick={() => runControl("toggle_playback").catch((error) => console.error(error))}
                  type="button"
                >
                  {state.isPlaying ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                  {state.isPlaying ? "Pause" : "Play"}
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 px-3 py-2 text-sm text-slate-100 hover:border-emerald-300/40 disabled:opacity-50"
                  disabled={acting}
                  onClick={() => runControl("next_track").catch((error) => console.error(error))}
                  type="button"
                >
                  <SkipForward size={14} /> Next
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-300">Nothing currently playing.</p>
          )}

          {state.controlErrorMessage ? (
            <p className="text-xs text-amber-300">{state.controlErrorMessage}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
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
            <a
              className="inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-sm text-slate-200 hover:border-emerald-300/40"
              href={`/api/spotify/connect?userId=${encodeURIComponent(userId)}`}
            >
              Re-connect Spotify
            </a>
          </div>
        </div>
      )}
    </Panel>
  );
}

function WorkoutTemplateView({ templateId }: { templateId: string }) {
  const template = getTemplateById(templateId);

  if (!template) {
    return <p className="text-sm text-slate-300">Template details unavailable.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-200">{template.description}</p>
      {template.days.map((day) => (
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
  );
}

function WorkoutPanel({
  payload,
  sheetTabs,
  selectedSheetGid,
  setSelectedSheetGid,
  onManualRefreshSheet,
  sheetSrc,
  sheetHeight,
  setSheetHeight,
  sheetZoom,
  setSheetZoom,
  sessionGoal,
  setSessionGoal,
  sessionSplit,
  setSessionSplit,
  sessionTemplateId,
  setSessionTemplateId,
}: {
  payload: DashboardPayload;
  sheetTabs: SheetTab[];
  selectedSheetGid: string;
  setSelectedSheetGid: (gid: string) => void;
  onManualRefreshSheet: () => void;
  sheetSrc: string | null;
  sheetHeight: number;
  setSheetHeight: (height: number) => void;
  sheetZoom: number;
  setSheetZoom: (zoom: number) => void;
  sessionGoal: string;
  setSessionGoal: (goal: string) => void;
  sessionSplit: string;
  setSessionSplit: (split: string) => void;
  sessionTemplateId: string | null;
  setSessionTemplateId: (templateId: string | null) => void;
}) {
  if (!payload.workoutSource) {
    return (
      <Panel className="h-full" title="Workout Plan" subtitle="No source configured">
        <p className="text-sm text-slate-300">Use workout source settings to connect a Google Sheet or select a template.</p>
      </Panel>
    );
  }

  if (payload.workoutSource.sourceType === "google_sheet" && sheetSrc) {
    const scale = sheetZoom / 100;
    const scaledHeight = Math.round(sheetHeight * scale);
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
            {sheetTabs.length > 0 ? (
              <select
                className="rounded-md border border-white/20 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                onChange={(event) => setSelectedSheetGid(event.target.value)}
                value={selectedSheetGid}
              >
                {sheetTabs.map((tab) => (
                  <option key={tab.gid} value={tab.gid}>
                    Tab {tab.name}
                  </option>
                ))}
              </select>
            ) : null}
            <select
              className="rounded-md border border-white/20 bg-slate-900 px-2 py-1 text-xs text-slate-100"
              onChange={(event) => setSheetHeight(Number(event.target.value))}
              value={sheetHeight}
            >
              {[620, 700, 780].map((value) => (
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
        <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-white/10 bg-white">
          <div className="relative" style={{ height: `${scaledHeight}px` }}>
            <iframe
              className="absolute left-0 top-0 block border-0"
              src={sheetSrc}
              style={{
                width: `${100 / scale}%`,
                height: `${sheetHeight}px`,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
              title="Workout Google Sheet"
            />
          </div>
        </div>
      </Panel>
    );
  }

  const isSessionPrompt = payload.user.templateSelectionMode === "session_prompt";
  const availableTemplates = filterTemplates(sessionGoal, sessionSplit);
  const selectedTemplateId =
    sessionTemplateId && availableTemplates.some((template) => template.id === sessionTemplateId)
      ? sessionTemplateId
      : availableTemplates[0]?.id ?? null;

  if (isSessionPrompt && !sessionTemplateId) {
    return (
      <Panel className="h-full overflow-auto" subtitle="Choose workout for this dashboard session" title="Select Workout">
        <div className="space-y-3">
          <p className="text-sm text-slate-300">
            Pick a workout plan for this session. This selection resets next time the dashboard is opened.
          </p>
          <label className="text-xs uppercase tracking-[0.14em] text-slate-300">General exercise type</label>
          <select
            className="w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white"
            onChange={(event) => {
              const nextGoal = event.target.value;
              const nextTemplates = filterTemplates(nextGoal, sessionSplit);
              setSessionGoal(nextGoal);
              setSessionTemplateId(nextTemplates[0]?.id ?? null);
            }}
            value={sessionGoal}
          >
            {WORKOUT_GOALS.map((goal) => (
              <option key={goal} value={goal}>
                {GOAL_LABELS[goal] ?? goal}
              </option>
            ))}
          </select>

          <label className="text-xs uppercase tracking-[0.14em] text-slate-300">Plan type</label>
          <select
            className="w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white"
            onChange={(event) => {
              const nextSplit = event.target.value;
              const nextTemplates = filterTemplates(sessionGoal, nextSplit);
              setSessionSplit(nextSplit);
              setSessionTemplateId(nextTemplates[0]?.id ?? null);
            }}
            value={sessionSplit}
          >
            {WORKOUT_SPLITS.map((split) => (
              <option key={split} value={split}>
                {SPLIT_LABELS[split] ?? split}
              </option>
            ))}
          </select>

          <label className="text-xs uppercase tracking-[0.14em] text-slate-300">Specific workout</label>
          <select
            className="w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white"
            onChange={(event) => setSessionTemplateId(event.target.value)}
            value={selectedTemplateId ?? ""}
          >
            {availableTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>

          <button
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
            onClick={() => setSessionTemplateId(selectedTemplateId)}
            type="button"
          >
            Start Workout
          </button>
        </div>
      </Panel>
    );
  }

  const templateToShow = isSessionPrompt
    ? sessionTemplateId
    : payload.workoutTemplate?.id ?? payload.workoutSource.templateId;

  return (
    <Panel className="h-full overflow-auto" subtitle="Template-based workout plan" title="Workout Plan">
      <div className="mb-3 flex flex-wrap gap-2">
        {isSessionPrompt ? (
          <button
            className="inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-sm text-slate-100 hover:border-emerald-300/40"
            onClick={() => setSessionTemplateId(null)}
            type="button"
          >
            Select Different Workout
          </button>
        ) : null}
      </div>
      {templateToShow ? <WorkoutTemplateView templateId={templateToShow} /> : <p className="text-sm text-slate-300">No template selected.</p>}
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
  const [showUtilityPanels, setShowUtilityPanels] = useState(false);
  const [sheetTabs, setSheetTabs] = useState<SheetTab[]>([]);
  const [selectedSheetGid, setSelectedSheetGid] = useState("");
  const [sheetRefreshToken, setSheetRefreshToken] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(700);
  const [sheetZoom, setSheetZoom] = useState(95);
  const [sessionGoal, setSessionGoal] = useState("maintenance");
  const [sessionSplit, setSessionSplit] = useState("full_body");
  const [sessionTemplateId, setSessionTemplateId] = useState<string | null>(null);

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

    if (payload.workoutSource?.sourceType === "template") {
      setSessionGoal(payload.workoutSource.goal ?? "maintenance");
      setSessionSplit(payload.workoutSource.split ?? "full_body");
      if (payload.user.templateSelectionMode === "session_prompt") {
        setSessionTemplateId(null);
      } else {
        setSessionTemplateId(payload.workoutSource.templateId ?? null);
      }
      setSheetTabs([]);
      setSelectedSheetGid("");
    } else if (payload.workoutSource?.sourceType === "google_sheet") {
      setSessionTemplateId(null);
    } else {
      setSheetTabs([]);
      setSelectedSheetGid("");
      setSessionTemplateId(null);
    }

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
    const source = data?.workoutSource;
    if (!source || source.sourceType !== "google_sheet" || !source.publishUrl) {
      return;
    }
    const publishUrl = source.publishUrl;

    let cancelled = false;
    async function loadTabs() {
      const response = await fetch(
        `/api/workouts/sheet-tabs?publishUrl=${encodeURIComponent(publishUrl)}`,
      );
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as { tabs: SheetTab[] };
      if (cancelled) {
        return;
      }
      setSheetTabs(payload.tabs ?? []);
      if (payload.tabs.length === 0) {
        setSelectedSheetGid("");
        return;
      }

      setSelectedSheetGid((current) => {
        if (current && payload.tabs.some((tab) => tab.gid === current)) {
          return current;
        }
        return pickDefaultSheetTab(payload.tabs)?.gid ?? payload.tabs[0]!.gid;
      });
    }

    loadTabs().catch((loadError) => console.error(loadError));
    return () => {
      cancelled = true;
    };
  }, [data?.workoutSource]);

  useEffect(() => {
    if (!data?.workoutSource || data.workoutSource.sourceType !== "google_sheet") {
      return;
    }
    const interval = setInterval(() => setSheetRefreshToken((current) => current + 1), 60_000);
    return () => clearInterval(interval);
  }, [data?.workoutSource]);

  const sheetSrc = useMemo(() => {
    const source = data?.workoutSource;
    if (!source || source.sourceType !== "google_sheet" || !source.publishUrl) {
      return null;
    }

    if (selectedSheetGid) {
      return toPublishedSheetTabUrl(source.publishUrl, selectedSheetGid, sheetRefreshToken);
    }

    try {
      const url = new URL(source.publishUrl);
      url.searchParams.set("rm", String(sheetRefreshToken));
      return url.toString();
    } catch {
      return source.publishUrl;
    }
  }, [data?.workoutSource, selectedSheetGid, sheetRefreshToken]);

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
    <main className="mx-auto max-w-[1650px] px-4 py-5 lg:py-6">
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
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm text-slate-100 hover:border-emerald-300/40"
              onClick={() => setShowUtilityPanels((current) => !current)}
              type="button"
            >
              <SlidersHorizontal size={16} />
              {showUtilityPanels ? "Hide Controls" : "Show Controls"}
            </button>
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

      <section className="mt-4 grid gap-4 lg:h-[calc(100vh-170px)] lg:grid-cols-[2.05fr_1fr]">
        <div className="min-h-0 lg:h-full">
          <WorkoutPanel
            onManualRefreshSheet={() => setSheetRefreshToken((current) => current + 1)}
            payload={data}
            sessionGoal={sessionGoal}
            sessionSplit={sessionSplit}
            sessionTemplateId={sessionTemplateId}
            setSessionGoal={setSessionGoal}
            setSessionSplit={setSessionSplit}
            setSessionTemplateId={setSessionTemplateId}
            selectedSheetGid={selectedSheetGid}
            setSelectedSheetGid={setSelectedSheetGid}
            setSheetHeight={setSheetHeight}
            setSheetZoom={setSheetZoom}
            sheetHeight={sheetHeight}
            sheetSrc={sheetSrc}
            sheetTabs={sheetTabs}
            sheetZoom={sheetZoom}
          />
        </div>

        <div className="space-y-4 lg:min-h-0 lg:overflow-y-auto">
          <ClockWeatherPanel timezone={data.user.timezone} weather={data.weather} />
          <SpotifyWidget linked={data.spotifyLinked} userId={data.user.id} />
          <RestTimerWidget storageKey={`rest-timer-${slug}`} />
          {(!kioskMode || showUtilityPanels) && (
            <>
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
                  <p>Template behavior: {data.user.templateSelectionMode === "session_prompt" ? "Prompt each load" : "Persistent"}</p>
                </div>
              </Panel>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
