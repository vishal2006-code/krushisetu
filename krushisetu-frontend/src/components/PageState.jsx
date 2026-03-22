export function LoadingState({ title = "Loading...", subtitle = "Please wait a moment." }) {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center">
        <div className="surface-panel px-10 py-12 text-center">
          <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{title}</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ title, subtitle, action }) {
  return (
    <div className="surface-panel border-dashed px-8 py-16 text-center">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-slate-500 dark:text-slate-400">{subtitle}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", message, action }) {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center">
        <div className="surface-panel border-rose-200/60 px-10 py-12 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-2xl text-rose-600 dark:bg-rose-500/10 dark:text-rose-200">
            !
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{title}</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{message}</p>
          {action ? <div className="mt-6">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function InlineNotice({ tone = "neutral", children }) {
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
    error: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200",
    warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
    neutral: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${styles[tone] || styles.neutral}`}>
      {children}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="surface-panel p-6">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-2xl bg-slate-200/80 dark:bg-slate-700/80" />
        <div className="flex-1 space-y-3">
          <div className="skeleton-line h-4 w-32" />
          <div className="skeleton-line h-3 w-48" />
          <div className="skeleton-line h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 4 }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}
