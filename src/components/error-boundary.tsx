import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

/** Clears app-owned local/session state that can corrupt rendering. */
function clearCorruptedState() {
  if (typeof window === "undefined") return;
  try {
    const keys = Object.keys(window.localStorage);
    for (const k of keys) {
      if (k.startsWith("manara.")) window.localStorage.removeItem(k);
    }
  } catch {
    /* storage blocked — nothing to clean */
  }
}

export class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[GlobalErrorBoundary]", error, info.componentStack);
  }

  private retry = () => {
    this.setState({ error: null });
  };

  private hardReset = () => {
    clearCorruptedState();
    if (typeof window !== "undefined") window.location.assign("/");
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div dir="rtl" className="flex min-h-[60vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-card md:p-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-2xl">⚠️</div>
          <h1 className="mt-4 text-xl font-extrabold">حدث خطأ غير متوقع</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            لا تقلق، بياناتك محفوظة. يمكنك إعادة المحاولة أو العودة إلى الصفحة الرئيسية.
          </p>
          <p className="mt-3 truncate rounded-lg bg-secondary px-3 py-2 text-[11px] text-muted-foreground" title={error.message}>
            {error.message || "خطأ غير معروف"}
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              onClick={this.retry}
              className="rounded-xl bg-gradient-royal px-5 py-2.5 text-sm font-extrabold text-gold shadow-luxury"
            >
              إعادة المحاولة
            </button>
            <button
              onClick={this.hardReset}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-extrabold transition-smooth hover:border-gold"
            >
              تفريغ الذاكرة والعودة للرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }
}
