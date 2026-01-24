type InfoTooltipProps = {
  text: string;
};

export function InfoTooltip({ text }: InfoTooltipProps) {
  
  return (
    <span className="group relative ml-1 inline-flex">
      <span
        aria-label={text}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-foreground/20 bg-white/80 text-[10px] font-semibold text-muted shadow-sm"
        role="img"
        title={text}
      >
        i
      </span>
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-52 -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs text-white opacity-0 shadow-lg transition group-hover:opacity-100">
        {text}
      </span>
    </span>
  );
}
