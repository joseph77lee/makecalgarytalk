import { badgeText } from './inviteText';
import { useInvites } from './liveStore';

/** Profile sheet part: invite button, counts, who invited me, badges. */
export function InviteSection({ onInvite }: { onInvite: () => void }) {
  const mine = useInvites((s) => s.mine);
  if (!mine) return null;
  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <h3 className="text-sm font-semibold text-slate-700">Neighbours</h3>
      <p className="mt-1 text-xs text-slate-500">
        {mine.invited === 0
          ? 'Invite neighbours: when they become residents of your community, you both get the Good Neighbour badge.'
          : `${mine.invited} accepted your invite · ${mine.joined} became your neighbours`}
      </p>
      {mine.invited_by && <p className="mt-1 text-xs text-slate-500">Invited by {mine.invited_by}</p>}
      <button type="button" onClick={onInvite} className="mt-2 w-full rounded-2xl bg-emerald-500 py-2 text-sm font-semibold text-white active:scale-[0.98]">
        Invite neighbours
      </button>
      {mine.badges.length > 0 && (
        <ul className="mt-3 space-y-1.5" aria-label="My badges">
          {mine.badges.map((b) => {
            const t = badgeText(b);
            return (
              <li key={`${b.key}-${'community' in b ? b.community : ''}`} className="flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-1.5">
                <span className="text-lg" aria-hidden>
                  {t.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-amber-900">{t.title}</span>
                  <span className="block text-[11px] text-amber-800/80">{t.detail}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
