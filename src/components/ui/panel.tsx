import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PanelProps = {
  title?: string;
  subtitle?: string;
  className?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function Panel({ title, subtitle, className, actions, children }: PanelProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/15 bg-slate-950/70 p-4 shadow-[0_10px_35px_-20px_rgba(0,0,0,0.7)] backdrop-blur",
        className,
      )}
    >
      {(title || subtitle || actions) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title ? <h2 className="text-base font-semibold text-white">{title}</h2> : null}
            {subtitle ? <p className="text-xs text-slate-300">{subtitle}</p> : null}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}
