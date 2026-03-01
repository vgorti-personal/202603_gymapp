"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Clock3,
  CloudSun,
  ExternalLink,
  Fullscreen,
  Music2,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Settings,
  Timer,
  Users,
} from "lucide-react";

import { Panel } from "@/components/ui/panel";
import type { CalendarEventDto, DashboardPayload, SpotifyNowPlaying } from "@/lib/types";
import { cn } from "@/lib/utils";

type DashboardClientProps = {
  slug: string;
};

function ClockWidget({ timezone }: { timezone: string }) {
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
    <div className="rounded-xl bg-slate-900/80 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Local Time</p>
      <p className="mt-1 text-xl font-semibold text-white">{formatted}</p>
    </div>
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
    const parsed = JSON.parse(raw) as { seconds: number; running: boolean };
    return parsed;
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
  }, [storageKey, seconds, running]);

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
    <Panel title="Rest Timer" subtitle="Track time between sets">
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl bg-slate-900/80 px-4 py-3">
          <span className="text-xs uppercase tracking-[0.16em] text-slate-300">Countdown</span>
          <span className="text-3xl font-semibold text-emerald-300">{formatSeconds(seconds)}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[60, 90, 120].map((value) => (
            <button
              key={value}
              className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:border-emerald-300/40 hover:text-white"
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
        <div className="flex gap-2">
          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
            onClick={() => setRunning((state) => !state)}
            type="button"
          >
            {running ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
            {running ? "Pause" : "Start"}
          </button>
          <button
            className="flex items-center justify-center rounded-lg border border-white/20 px-3 py-2 text-sm text-slate-200 hover:border-white/40 hover:text-white"
            onClick={() => {
              setRunning(false);
              setSeconds(120);
            }}
            type="button"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    </Panel>
  );
}

function CalendarWidget({
  slug,
  events,
  onEventsUpdate,
}: {
  slug: string;
  events: CalendarEventDto[];
  onEventsUpdate: (next: CalendarEventDto[]) => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);

  async function addEvent() {
    if (!title || !date) {
      return;
    }
    setPending(true);
    try {
      const result = await fetch(`/api/users/${slug}/calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          eventDate: new Date(`${date}T12:00:00`).toISOString(),
          notes: notes || null,
        }),
      });
      if (!result.ok) {
        return;
      }
      const json = (await result.json()) as { event: CalendarEventDto };
      onEventsUpdate([...events, json.event].sort((a, b) => a.eventDate.localeCompare(b.eventDate)));
      setTitle("");
      setDate("");
      setNotes("");
    } finally {
      setPending(false);
    }
  }

  async function setStatus(eventId: string, status: "planned" | "done") {
    const response = await fetch(`/api/users/${slug}/calendar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, status }),
    });
    if (!response.ok) {
      return;
    }
    const json = (await response.json()) as { event: CalendarEventDto };
    onEventsUpdate(events.map((event) => (event.id === eventId ? json.event : event)));
  }

  return (
    <Panel title="Workout Calendar" subtitle="Plan and check off sessions">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-400 focus:border-emerald-300/50"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Session title"
            value={title}
          />
          <input
            className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/50"
            onChange={(event) => setDate(event.target.value)}
            type="date"
            value={date}
          />
        </div>
        <textarea
          className="h-16 w-full resize-none rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-400 focus:border-emerald-300/50"
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Optional notes"
          value={notes}
        />
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400 disabled:opacity-40"
          disabled={pending}
          onClick={addEvent}
          type="button"
        >
          <Plus size={16} />
          Add Session
        </button>
        <div className="space-y-2">
          {events.length === 0 ? (
            <p className="rounded-lg bg-slate-900/60 px-3 py-2 text-sm text-slate-300">
              No sessions yet. Add one above.
            </p>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className={cn(
                  "rounded-lg border px-3 py-2",
                  event.status === "done"
                    ? "border-emerald-300/30 bg-emerald-600/10"
                    : "border-white/10 bg-slate-900/70",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{event.title}</p>
                    <p className="text-xs text-slate-300">
                      {new Date(event.eventDate).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    className={cn(
                      "rounded-md px-2 py-1 text-xs font-medium",
                      event.status === "done"
                        ? "bg-emerald-400 text-slate-950"
                        : "border border-white/20 text-slate-100 hover:border-emerald-300/40",
                    )}
                    onClick={() =>
                      setStatus(event.id, event.status === "done" ? "planned" : "done")
                    }
                    type="button"
                  >
                    {event.status === "done" ? "Done" : "Mark Done"}
                  </button>
                </div>
                {event.notes ? <p className="mt-2 text-xs text-slate-300">{event.notes}</p> : null}
              </div>
            ))
          )}
        </div>
      </div>
    </Panel>
  );
}

function SpotifyWidget({
  userId,
  linked,
}: {
  userId: string;
  linked: boolean;
}) {
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
      clearInterval(interval);
      clearTimeout(kickoff);
    };
  }, [pullNowPlaying]);

  return (
    <Panel title="Spotify Now Playing" subtitle="Synced to this user account">
      {!linked ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">
            Spotify is not linked yet. Connect account or use fallback playlist.
          </p>
          <a
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
            href={`/api/spotify/connect?userId=${encodeURIComponent(userId)}`}
          >
            Connect Spotify
          </a>
          <iframe
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className="h-[152px] w-full rounded-lg border border-white/10"
            loading="lazy"
            src="https://open.spotify.com/embed/playlist/37i9dQZF1DX76Wlfdnj7AP"
            title="Fallback Spotify Playlist"
          />
        </div>
      ) : (
        <div className="space-y-3">
          {state.trackName ? (
            <>
              {state.albumArtUrl ? (
                <Image
                  alt={state.albumName ?? "Album art"}
                  className="h-44 w-full rounded-lg object-cover"
                  height={176}
                  src={state.albumArtUrl}
                  unoptimized
                  width={440}
                />
              ) : null}
              <div>
                <p className="text-sm font-semibold text-white">{state.trackName}</p>
                <p className="text-xs text-slate-300">{state.artistName}</p>
                <p className="text-xs text-slate-400">{state.albumName}</p>
              </div>
              {state.externalUrl ? (
                <a
                  className="inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-sm text-slate-200 hover:border-emerald-300/40 hover:text-white"
                  href={state.externalUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open in Spotify <ExternalLink size={14} />
                </a>
              ) : null}
            </>
          ) : (
            <p className="rounded-lg bg-slate-900/70 px-3 py-2 text-sm text-slate-300">
              Nothing currently playing.
            </p>
          )}
        </div>
      )}
    </Panel>
  );
}

function WorkoutPanel({
  payload,
  onRefreshDashboard,
  frameKey,
  onManualRefreshSheet,
}: {
  payload: DashboardPayload;
  onRefreshDashboard: () => Promise<void>;
  frameKey: number;
  onManualRefreshSheet: () => void;
}) {
  if (!payload.workoutSource) {
    return (
      <Panel title="Workout Plan" subtitle="No plan configured">
        <p className="text-sm text-slate-300">Use the admin panel to set a Google Sheet or template.</p>
      </Panel>
    );
  }

  if (payload.workoutSource.sourceType === "google_sheet" && payload.workoutSource.publishUrl) {
    return (
      <Panel
        actions={
          <div className="flex gap-2">
            <button
              className="rounded-md border border-white/20 px-2 py-1 text-xs text-slate-100 hover:border-emerald-300/40"
              onClick={onManualRefreshSheet}
              type="button"
            >
              Refresh Sheet
            </button>
            <button
              className="rounded-md border border-white/20 px-2 py-1 text-xs text-slate-100 hover:border-emerald-300/40"
              onClick={() => onRefreshDashboard().catch((error) => console.error(error))}
              type="button"
            >
              Refresh Data
            </button>
          </div>
        }
        subtitle="Live published view of your training sheet"
        title="Workout Plan"
      >
        <div className="space-y-3">
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
          <iframe
            className="h-[440px] w-full rounded-lg border border-white/10 bg-white"
            key={frameKey}
            src={payload.workoutSource.publishUrl}
            title="Workout Google Sheet"
          />
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      subtitle="Template-based plan using home gym equipment"
      title={payload.workoutTemplate?.name ?? "Template Workout"}
    >
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
        <p className="text-sm text-slate-300">Template unavailable. Update source in Admin panel.</p>
      )}
    </Panel>
  );
}

export function DashboardClient({ slug }: DashboardClientProps) {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kioskMode, setKioskMode] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem(`gym-dashboard-kiosk-${slug}`) === "1";
  });
  const [sheetFrameKey, setSheetFrameKey] = useState(0);

  const refreshDashboard = useCallback(async () => {
    const response = await fetch(`/api/users/${slug}/dashboard`, { cache: "no-store" });
    if (!response.ok) {
      setError("Unable to load dashboard.");
      setLoading(false);
      return;
    }
    const payload = (await response.json()) as DashboardPayload;
    setData(payload);
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
      <main className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-slate-200">Loading dashboard...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-red-300">{error ?? "Dashboard not available."}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div
        className={cn(
          "mb-6 rounded-2xl border border-white/20 bg-slate-950/70 p-4 backdrop-blur",
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
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm text-slate-100 hover:border-emerald-300/40 hover:text-white"
              href="/"
            >
              <Users size={16} />
              Switch User
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm text-slate-100 hover:border-emerald-300/40 hover:text-white"
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
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <ClockWidget timezone={data.user.timezone} />
          <div className="rounded-xl bg-slate-900/80 px-4 py-3">
            <div className="flex items-center gap-2 text-slate-200">
              <CloudSun size={18} />
              <span className="text-xs uppercase tracking-[0.16em] text-slate-300">Weather</span>
            </div>
            {data.weather ? (
              <p className="mt-1 text-xl font-semibold text-white">
                {data.weather.city}: {data.weather.temperatureC}C, {data.weather.weatherDescription}
                {"  "}
                (H {data.weather.highC} / L {data.weather.lowC})
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-300">
                Weather unavailable for {data.user.defaultCity}
              </p>
            )}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "grid gap-4 lg:grid-cols-3",
          kioskMode ? "text-lg" : "",
        )}
      >
        <div className="space-y-4 lg:col-span-2">
          <WorkoutPanel
            frameKey={sheetFrameKey}
            onManualRefreshSheet={() => setSheetFrameKey((current) => current + 1)}
            onRefreshDashboard={refreshDashboard}
            payload={data}
          />
          {!kioskMode ? (
            <CalendarWidget
              events={data.calendarEvents}
              onEventsUpdate={(next) => setData({ ...data, calendarEvents: next })}
              slug={slug}
            />
          ) : null}
        </div>

        <div className="space-y-4">
          <Panel title="Status" subtitle="Quick glance widgets">
            <div className="grid gap-2">
              <div className="flex items-center gap-2 rounded-lg bg-slate-900/80 p-3 text-sm text-slate-200">
                <Clock3 size={16} />
                Timezone: {data.user.timezone}
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-slate-900/80 p-3 text-sm text-slate-200">
                <Calendar size={16} />
                {data.calendarEvents.filter((event) => event.status === "planned").length} planned
                sessions
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-slate-900/80 p-3 text-sm text-slate-200">
                <Music2 size={16} />
                Spotify {data.spotifyLinked ? "linked" : "not linked"}
              </div>
            </div>
          </Panel>
          <RestTimerWidget storageKey={`rest-timer-${slug}`} />
          <SpotifyWidget linked={data.spotifyLinked} userId={data.user.id} />
          {!kioskMode ? (
            <Panel title="Session Utilities" subtitle="Workout support tools">
              <div className="space-y-2 text-sm text-slate-200">
                <p className="flex items-center gap-2">
                  <Timer size={16} /> Use the rest timer between compound sets.
                </p>
                <p className="flex items-center gap-2">
                  <RefreshCw size={16} /> Google Sheet auto-refreshes every 60 seconds.
                </p>
              </div>
            </Panel>
          ) : null}
        </div>
      </div>
    </main>
  );
}
