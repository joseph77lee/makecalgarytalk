import { useEffect } from 'react';
import { Avatar, moveTo } from '../modules/avatar';
import { ActionBar, CommunityPicker, SessionScreen, Toast, useDailyActions } from '../modules/daily-actions';
import { IslandDevPanel, IslandHud, IslandView, useMockCommunityStore, type CommunityViewState, type IslandPlan } from '../modules/island-view';

const params = new URLSearchParams(window.location.search);
/** `?mock` shows the M1 mock island with its dev panel (no server needed). */
const mockMode = params.has('mock');

export function App() {
  return mockMode ? <MockApp /> : <LiveApp />;
}

/** The real game: community state from the server, daily actions. */
function LiveApp() {
  const status = useDailyActions((s) => s.status);
  const view = useDailyActions((s) => s.view);
  const plan = useDailyActions((s) => s.plan);
  const init = useDailyActions((s) => s.init);
  const openPicker = useDailyActions((s) => s.openCommunityPicker);
  useEffect(() => {
    void init();
  }, [init]);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-gradient-to-b from-sky-100 to-indigo-50">
      {view && plan && <Island plan={plan} state={view} />}
      {view && <IslandHud state={view} />}
      {status === 'ready' && <ActionBar />}
      {status === 'pick-community' && <CommunityPicker />}
      <SessionScreen />
      <Toast />
      {import.meta.env.DEV && status === 'ready' && (
        <button
          type="button"
          onClick={() => void openPicker()}
          className="absolute left-3 top-16 z-30 rounded-full bg-white/80 px-3 py-1 text-[11px] text-slate-600 shadow-sm"
        >
          Switch community (dev)
        </button>
      )}
    </main>
  );
}

function MockApp() {
  const state = useMockCommunityStore((s) => s.state);
  const plan = useMockCommunityStore((s) => s.plan);
  const loadPlan = useMockCommunityStore((s) => s.loadPlan);
  useEffect(() => {
    // `?mock&plan=BLN` shows another community's real shape.
    void loadPlan(params.get('plan') ?? undefined);
  }, [loadPlan]);
  return (
    <main className="relative h-dvh w-full overflow-hidden">
      {plan && <Island plan={plan} state={state} />}
      <IslandHud state={state} />
      <IslandDevPanel />
    </main>
  );
}

function Island({ plan, state }: { plan: IslandPlan; state: CommunityViewState }) {
  return (
    <IslandView plan={plan} state={state} onTileTap={moveTo}>
      {/* Nickname comes from Identity (M6); a placeholder until then. */}
      <Avatar nickname="You" />
    </IslandView>
  );
}
