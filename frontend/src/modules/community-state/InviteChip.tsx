/** Small green "👋 Invite" chip used next to "N more neighbours" goals (shared look). */
export function InviteChip({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ml-1 inline-flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm active:scale-95"
    >
      <span aria-hidden>👋</span> Invite
    </button>
  );
}
