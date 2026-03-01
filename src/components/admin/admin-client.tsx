"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, LogOut, Plus, Save, ShieldCheck } from "lucide-react";

import { Panel } from "@/components/ui/panel";
import { slugify } from "@/lib/utils";
import { WORKOUT_GOALS, WORKOUT_SPLITS, WORKOUT_TEMPLATES } from "@/lib/workout-templates";

type AdminUser = {
  id: string;
  displayName: string;
  slug: string;
  defaultCity: string;
  timezone: string;
  spotifyEnabled: boolean;
  templateSelectionMode: "persistent" | "session_prompt";
  spotifyLinked: boolean;
  workoutSource: {
    sourceType: "google_sheet" | "template";
    publishUrl: string | null;
    editUrl: string | null;
    goal: string | null;
    split: string | null;
    templateId: string | null;
  } | null;
};

type AdminClientProps = {
  authenticated: boolean;
  users: AdminUser[];
};

type Feedback = {
  type: "success" | "error";
  message: string;
};

export function AdminClient({ authenticated, users: initialUsers }: AdminClientProps) {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [users, setUsers] = useState(initialUsers);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newUserName, setNewUserName] = useState("");
  const [newUserCity, setNewUserCity] = useState("Atlanta, GA, USA");
  const [newUserTimezone, setNewUserTimezone] = useState("America/New_York");
  const [addUserFeedback, setAddUserFeedback] = useState<Feedback | null>(null);
  const [saveFeedbackByUser, setSaveFeedbackByUser] = useState<Record<string, Feedback>>({});

  async function login() {
    setAuthError(null);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    if (!response.ok) {
      setAuthError("Invalid passcode.");
      return;
    }
    router.refresh();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  async function addUser() {
    setAddUserFeedback(null);
    const displayName = newUserName.trim();
    if (!displayName) {
      setAddUserFeedback({ type: "error", message: "Display name is required." });
      return;
    }

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName,
        slug: slugify(displayName),
        defaultCity: newUserCity,
        timezone: newUserTimezone,
      }),
    });

    if (!response.ok) {
      const json = (await response.json().catch(() => null)) as { error?: string } | null;
      setAddUserFeedback({
        type: "error",
        message: typeof json?.error === "string" ? json.error : "Could not add user.",
      });
      return;
    }

    setAddUserFeedback({ type: "success", message: "User added successfully." });
    setNewUserName("");
    router.refresh();
  }

  if (!authenticated) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <Panel subtitle="Passcode-protected controls" title="Admin Access">
          <div className="space-y-3">
            <p className="text-sm text-slate-300">
              Enter your admin passcode to manage users, weather city, timezone, and workout source settings.
            </p>
            <input
              className="w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40"
              onChange={(event) => setPasscode(event.target.value)}
              placeholder="Admin passcode"
              type="password"
              value={passcode}
            />
            {authError ? <p className="text-sm text-red-300">{authError}</p> : null}
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
              onClick={login}
              type="button"
            >
              <ShieldCheck size={16} />
              Unlock Admin
            </button>
          </div>
        </Panel>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-4 px-4 py-8">
      <Panel
        actions={
          <div className="flex items-center gap-2">
            <Link
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm text-slate-100 hover:border-emerald-300/40"
              href="/"
            >
              <Home size={14} />
              Back to Home
            </Link>
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm text-slate-100 hover:border-red-300/40"
              onClick={logout}
              type="button"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        }
        subtitle="Configure user workout source, weather city, timezone, and Spotify settings"
        title="Gym Dashboard Admin"
      >
        <p className="text-sm text-slate-300">
          Add users below, then manage each user card in the section after it.
        </p>
      </Panel>

      <Panel subtitle="Create a new dashboard profile" title="Add User">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40"
            onChange={(event) => setNewUserName(event.target.value)}
            placeholder="Display name"
            value={newUserName}
          />
          <input
            className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40"
            onChange={(event) => setNewUserCity(event.target.value)}
            placeholder="Default weather city"
            value={newUserCity}
          />
          <input
            className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40"
            onChange={(event) => setNewUserTimezone(event.target.value)}
            placeholder="Timezone"
            value={newUserTimezone}
          />
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
            onClick={() => addUser().catch((error) => console.error(error))}
            type="button"
          >
            <Plus size={16} />
            Add User
          </button>
        </div>
        {addUserFeedback ? (
          <p className={addUserFeedback.type === "success" ? "mt-3 text-sm text-emerald-300" : "mt-3 text-sm text-red-300"}>
            {addUserFeedback.message}
          </p>
        ) : null}
      </Panel>

      <Panel subtitle="Manage existing user settings" title="User Configuration">
        {users.length === 0 ? (
          <p className="text-sm text-slate-300">No users found.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {users.map((user) => (
              <UserConfigCard
                feedback={saveFeedbackByUser[user.id] ?? null}
                key={user.id}
                onChange={(next) => {
                  setUsers(users.map((entry) => (entry.id === user.id ? next : entry)));
                }}
                onSave={async (next) => {
                  setSavingId(user.id);
                  setSaveFeedbackByUser((current) => {
                    const copy = { ...current };
                    delete copy[user.id];
                    return copy;
                  });
                  try {
                    const userPayload = {
                      displayName: next.displayName,
                      defaultCity: next.defaultCity,
                      timezone: next.timezone,
                      spotifyEnabled: next.spotifyEnabled,
                      templateSelectionMode: next.templateSelectionMode,
                    };

                    const userResponse = await fetch(`/api/admin/users/${next.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(userPayload),
                    });

                    if (!userResponse.ok) {
                      setSaveFeedbackByUser((current) => ({
                        ...current,
                        [user.id]: { type: "error", message: "User settings failed to save." },
                      }));
                      return;
                    }

                    const sourceResponse = await fetch(`/api/admin/users/${next.id}/workout-source`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(next.workoutSource),
                    });

                    if (!sourceResponse.ok) {
                      const payload = (await sourceResponse.json().catch(() => null)) as { error?: string } | null;
                      setSaveFeedbackByUser((current) => ({
                        ...current,
                        [user.id]: {
                          type: "error",
                          message: typeof payload?.error === "string" ? payload.error : "Workout source failed to save.",
                        },
                      }));
                      return;
                    }

                    setSaveFeedbackByUser((current) => ({
                      ...current,
                      [user.id]: { type: "success", message: "User settings saved." },
                    }));
                    router.refresh();
                  } finally {
                    setSavingId(null);
                  }
                }}
                saving={savingId === user.id}
                user={user}
              />
            ))}
          </div>
        )}
      </Panel>
    </main>
  );
}

function UserConfigCard({
  user,
  onChange,
  onSave,
  saving,
  feedback,
}: {
  user: AdminUser;
  onChange: (next: AdminUser) => void;
  onSave: (next: AdminUser) => Promise<void>;
  saving: boolean;
  feedback: Feedback | null;
}) {
  const source = user.workoutSource ?? {
    sourceType: "template" as const,
    publishUrl: null,
    editUrl: null,
    goal: "maintenance",
    split: "full_body",
    templateId: "maintenance-full-body-3x",
  };

  const filteredTemplates = useMemo(() => {
    return WORKOUT_TEMPLATES.filter((template) => {
      const goalMatches = source.goal ? template.goal === source.goal : true;
      const splitMatches = source.split ? template.split === source.split : true;
      return goalMatches && splitMatches;
    });
  }, [source.goal, source.split]);

  return (
    <Panel subtitle={`/${user.slug}`} title={user.displayName}>
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40"
            onChange={(event) => onChange({ ...user, displayName: event.target.value })}
            value={user.displayName}
          />
          <input
            className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40"
            onChange={(event) => onChange({ ...user, defaultCity: event.target.value })}
            placeholder="Weather city"
            value={user.defaultCity}
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40"
            onChange={(event) => onChange({ ...user, timezone: event.target.value })}
            placeholder="Timezone"
            value={user.timezone}
          />
          <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200">
            <input
              checked={user.spotifyEnabled}
              onChange={(event) => onChange({ ...user, spotifyEnabled: event.target.checked })}
              type="checkbox"
            />
            Spotify enabled ({user.spotifyLinked ? "linked" : "unlinked"})
          </label>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="text-xs uppercase tracking-[0.14em] text-slate-300">Template behavior</label>
          <select
            className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40"
            onChange={(event) =>
              onChange({
                ...user,
                templateSelectionMode: event.target.value as "persistent" | "session_prompt",
              })
            }
            value={user.templateSelectionMode}
          >
            <option value="persistent">Persistent default workout</option>
            <option value="session_prompt">Prompt each dashboard load</option>
          </select>
        </div>

        <div className="rounded-lg border border-white/10 bg-slate-900/80 p-3">
          <p className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-300">Workout Source</p>
          <select
            className="w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40"
            onChange={(event) =>
              onChange({
                ...user,
                workoutSource: {
                  ...source,
                  sourceType: event.target.value as "google_sheet" | "template",
                },
              })
            }
            value={source.sourceType}
          >
            <option value="template">Template</option>
            <option value="google_sheet">Google Sheet</option>
          </select>

          {source.sourceType === "google_sheet" ? (
            <div className="mt-2 grid grid-cols-1 gap-2">
              <input
                className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40"
                onChange={(event) =>
                  onChange({
                    ...user,
                    workoutSource: { ...source, publishUrl: event.target.value },
                  })
                }
                placeholder="Publish URL"
                value={source.publishUrl ?? ""}
              />
              <input
                className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40"
                onChange={(event) =>
                  onChange({
                    ...user,
                    workoutSource: { ...source, editUrl: event.target.value },
                  })
                }
                placeholder="Edit URL"
                value={source.editUrl ?? ""}
              />
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-1 gap-2">
              <select
                className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40"
                onChange={(event) =>
                  onChange({
                    ...user,
                    workoutSource: { ...source, goal: event.target.value },
                  })
                }
                value={source.goal ?? "maintenance"}
              >
                {WORKOUT_GOALS.map((goal) => (
                  <option key={goal} value={goal}>
                    Goal: {goal}
                  </option>
                ))}
              </select>

              <select
                className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40"
                onChange={(event) =>
                  onChange({
                    ...user,
                    workoutSource: { ...source, split: event.target.value },
                  })
                }
                value={source.split ?? "full_body"}
              >
                {WORKOUT_SPLITS.map((split) => (
                  <option key={split} value={split}>
                    Split: {split}
                  </option>
                ))}
              </select>

              <select
                className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40"
                onChange={(event) =>
                  onChange({
                    ...user,
                    workoutSource: { ...source, templateId: event.target.value },
                  })
                }
                value={source.templateId ?? ""}
              >
                {filteredTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {feedback ? (
          <p className={feedback.type === "success" ? "text-xs text-emerald-300" : "text-xs text-red-300"}>
            {feedback.message}
          </p>
        ) : null}

        <button
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          disabled={saving}
          onClick={() => onSave({ ...user, workoutSource: source }).catch((error) => console.error(error))}
          type="button"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save User Settings"}
        </button>
      </div>
    </Panel>
  );
}
