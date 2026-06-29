export function PageSpinner() {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
    </div>
  );
}
