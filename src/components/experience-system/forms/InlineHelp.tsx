export function InlineHelp({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <p id={id} className="text-xs text-slate-500">
      {children}
    </p>
  );
}
