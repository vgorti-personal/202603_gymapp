"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Plus, Save, ShieldCheck } from "lucide-react";

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

export function AdminClient({ authenticated, users: initialUsers }: AdminClientProps) {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [users, setUsers] = useState(initialUsers);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newUserName, setNewUserName] = useState("");
  const [newUserCity, setNewUserCity] = useState("New York");
  const [newUserTimezone, setNewUserTimezone] = useState("America/New_York");

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
    if (!newUserName.trim()) {
      return;
    }
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: newUserName,
        slug: slugify(newUserName),
        defaultCity: newUserCity,
        timezone: newUserTimezone,
      }),
    });
    if (!response.ok) {
      return;
    }
    router.refresh();
  }

  if (!authenticated) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <Panel subtitle="Passcode-protected controls" title="Admin Access">
          <div className="space-y-3">
            <p className="text-sm text-slate-300">
              Enter your admin passcode to manage users, workout sources, and dashboard defaults.
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
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm text-slate-100 hover:border-red-300/40"
            onClick={logout}
            type="button"
          >
            <LogOut size={16} />
            Logout
          </button>
        }
        subtitle="Add users and tune user-specific settings"
        title="Gym Dashboard Admin"
      >
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
            placeholder="Default city"
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
            onClick={addUser}
            type="button"
          >
            <Plus size={16} />
            Add User
          </button>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        {users.map((user) => (
          <UserConfigCard
            key={user.id}
            onChange={(next) => {
              setUsers(users.map((entry) => (entry.id === user.id ? next : entry)));
            }}
            onSave={async (next) => {
              setSavingId(user.id);
              try {
                const userPayload = {
                  displayName: next.displayName,
                  defaultCity: next.defaultCity,
                  timezone: next.timezone,
                  spotifyEnabled: next.spotifyEnabled,
                };
                await fetch(`/api/admin/users/${next.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(userPayload),
                });
                await fetch(`/api/admin/users/${next.id}/workout-source`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(next.workoutSource),
                });
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
    </main>
  );
}

function UserConfigCard({
  user,
  onChange,
  onSave,
  saving,
}: {
  user: AdminUser;
  onChange: (next: AdminUser) => void;
  onSave: (next: AdminUser) => Promise<void>;
  saving: boolean;
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
            value={user.defaultCity}
          />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40"
            onChange={(event) => onChange({ ...user, timezone: event.target.value })}
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
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          disabled={saving}
          onClick={() => onSave({ ...user, workoutSource: source })}
          type="button"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save User Settings"}
        </button>
      </div>
    </Panel>
  );
}
