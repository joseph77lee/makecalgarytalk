import { welcomeGoal } from './inviteText';
import { useInvites } from './liveStore';

interface Props {
  communityId: string;
  communityName: string;
  /** Verified Residents so far (cumulative). */
  residents: number;
  nextLandResidents: number | null;
  onInvite: () => void;
}

/**
 * Right after the first counted check-in (§5.1): welcome, how many neighbours the island needs,
 * and the invite. The app shows it once per community on this device (`welcomedIds`).
 */
export function WelcomeCard({ communityId, communityName, residents, nextLandResidents, onInvite }: Props) {
  const markWelcomed = useInvites((s) => s.markWelcomed);
  const close = () => markWelcomed(communityId);
  const neighbours = residents === 0 ? 'Nobody lives here yet: you are the first!' : `${residents} ${residents === 1 ? 'neighbour lives' : 'neighbours live'} here.`;

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-slate-900/20 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
      <div role="dialog" aria-label={`Welcome to ${communityName}`} className="w-full max-w-sm rounded-3xl bg-white p-5 text-center shadow-xl">
        <p className="text-3xl" aria-hidden>
          🎉
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-800">Welcome to {communityName}!</h2>
        <p className="mt-1 text-sm text-slate-600">{neighbours}</p>
        <p className="mt-2 rounded-2xl bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800">🏝 {welcomeGoal(nextLandResidents)}</p>
        <p className="mt-2 text-xs text-slate-500">You can't finish a community alone. Every neighbour who joins makes it grow faster.</p>
        <button
          type="button"
          onClick={() => {
            close();
            onInvite();
          }}
          className="mt-4 w-full rounded-2xl bg-emerald-500 py-2.5 text-sm font-semibold text-white active:scale-[0.98]"
        >
          Invite neighbours
        </button>
        <button type="button" onClick={close} className="mt-2 w-full text-center text-xs text-slate-500 underline">
          Look around first
        </button>
      </div>
    </div>
  );
}
