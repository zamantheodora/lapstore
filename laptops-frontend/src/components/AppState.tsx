import Link from "next/link";
import type { ReactNode } from "react";

type AppStateTone = "empty" | "error" | "success";

type AppStateProps = {
  tone: AppStateTone;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  action?: ReactNode;
  className?: string;
};

const toneStyles: Record<AppStateTone, string> = {
  empty: "border-slate-200 bg-slate-50/90 text-slate-700",
  error: "border-rose-200 bg-rose-50/90 text-rose-900",
  success: "border-emerald-200 bg-emerald-50/90 text-emerald-900",
};

export default function AppState({ tone, title, description, actionLabel, actionHref, action, className = "" }: AppStateProps) {
  return (
    <div className={`premium-soft-panel mt-6 rounded-2xl border p-6 ${toneStyles[tone]} ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em]">{tone}</p>
      <h3 className="mt-2 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 opacity-90">{description}</p>

      {action ? <div className="mt-4">{action}</div> : null}

      {!action && actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="mt-4 inline-flex items-center rounded-xl border border-current/25 bg-white px-4 py-2 text-sm font-semibold transition hover:bg-white/70"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
