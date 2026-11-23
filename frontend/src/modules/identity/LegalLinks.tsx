/** Links to the Terms, Privacy Policy and data credits (static pages, requirement.md §18). */
export function LegalLinks({ className = '' }: { className?: string }) {
  const link = 'underline decoration-slate-300 underline-offset-2';
  return (
    <p className={`text-center text-[11px] text-slate-400 ${className}`}>
      <a href="/terms.html" target="_blank" rel="noreferrer" className={link}>
        Terms
      </a>
      {' · '}
      <a href="/privacy.html" target="_blank" rel="noreferrer" className={link}>
        Privacy
      </a>
      {' · '}
      <a href="/credits.html" target="_blank" rel="noreferrer" className={link}>
        Credits
      </a>
    </p>
  );
}
