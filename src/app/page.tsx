import Link from "next/link";
import { Dumbbell, Settings2, Users } from "lucide-react";

import { listUsers } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const users = await listUsers().catch((error) => {
    console.error(error);
    return [];
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-12 sm:px-8">
      <section className="rounded-3xl border border-white/20 bg-slate-950/75 p-6 shadow-[0_25px_70px_-40px_rgba(0,0,0,0.9)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-emerald-300">Home Gym</p>
            <h1 className="mt-1 text-4xl font-semibold text-white">Gym Dashboard</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Pick a user profile to open a personalized cast-friendly dashboard with workout plan,
              weather, clock, Spotify, and workout source controls.
            </p>
          </div>
          <Link
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm text-slate-100 hover:border-emerald-300/50 hover:text-white"
            href="/admin"
          >
            <Settings2 size={16} />
            Admin
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {users.map((user) => (
            <Link
              className="rounded-2xl border border-white/20 bg-slate-900/80 p-4 transition hover:-translate-y-0.5 hover:border-emerald-300/50 hover:shadow-[0_20px_35px_-25px_rgba(52,211,153,0.7)]"
              href={`/dashboard/${user.slug}`}
              key={user.id}
            >
              <p className="text-lg font-semibold text-white">{user.displayName}</p>
              <p className="text-sm text-slate-300">{user.defaultCity}</p>
            </Link>
          ))}
        </div>
        {users.length === 0 ? (
          <div className="mt-6 rounded-xl border border-yellow-300/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
            <p className="flex items-center gap-2 font-medium">
              <Users size={16} />
              No users found
            </p>
            <p className="mt-1">
              Run migrations and seed data to create Vishy, Emily, and Guest. Start with
              `npm run db:migrate` then `npm run db:seed`.
            </p>
          </div>
        ) : null}
        <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-slate-400">
          <Dumbbell size={14} />
          Built for laptop-to-TV casting in your home gym
        </div>
      </section>
    </main>
  );
}
