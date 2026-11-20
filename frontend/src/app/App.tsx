import { useEffect, useState } from 'react';
import { Avatar, moveTo } from '../modules/avatar';
import { BuildMap, ChangesPanel, StreakBar } from '../modules/community-state';
import { ActionBar, CommunityPicker, SessionScreen, Toast, useDailyActions } from '../modules/daily-actions';
import {
  IslandDevPanel,
  IslandHud,
  IslandView,
  finishedExampleState,
  useMockCommunityStore,
  type CommunityViewState,
  type IslandPlan,
} from '../modules/island-view';

const params = new URLSearchParams(window.location.search);
/** `?mock` shows the M1 mock island with its dev panel (no server needed). */
const mockMode = params.has('mock');

export function App() {
  return mockMode ? <MockApp /> : <LiveApp />;
}

/** The real game: community state from the server, daily actions. */
function LiveApp() {
  const status = useDailyActions((s) => s.status);
  const server = useDailyActions((s) => s.server);
  const view = useDailyActions((s) => s.view);
  const [mapOpen, setMapOpen] = useState(false);
  const [example, setExample] = useState(false);
  const plan = useDailyActions((s) => s.plan);
  const init = useDailyActions((s) => s.init);
  const openPicker = useDailyActions((s) => s.openCommunityPicker);
  useEffect(() => {
    void init();
  }, [init]);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-gradient-to-b from-sky-100 to-indigo-50">
      {example && view && plan ? (
        <ExampleView plan={plan} communityName={view.communityName} onBack={() => setExample(false)} />
      ) : (
        <>
          {view && plan && <Island plan={plan} state={view} />}
          {view && <IslandHud state={view} />}
          {status === 'ready' && server && (
            <>
              <StreakBar streak={server.streak} nextLandResidents={server.community.next_land_residents} onOpenMap={() => setMapOpen(true)} />
              <ActionBar />
              <ChangesPanel calgaryDay={server.calgary_day} changes={server.changes} vitality={server.community.vitality} />
            </>
          )}
          {mapOpen && server && view && (
            <BuildMap
              community={server.community}
              streakDays={server.streak.days}
              buildings={view.buildings}
              onClose={() => setMapOpen(false)}
              onShowExample={() => {
                setMapOpen(false);
                setExample(true);
              }}
            />
          )}
        </>
      )}
      {status === 'pick-community' && <CommunityPicker />}
      <SessionScreen />
      <Toast />
      {import.meta.env.DEV && status === 'ready' && !example && (
        <button
          type="button"
          onClick={() => void openPicker()}
          className="absolute bottom-40 left-3 z-30 rounded-full bg-white/80 px-3 py-1 text-[11px] text-slate-600 shadow-sm"
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

/** "See a finished example": this community's island with the whole tree built (§7.6a). */
function ExampleView({ plan, communityName, onBack }: { plan: IslandPlan; communityName: string; onBack: () => void }) {
  const [state] = useState(() => finishedExampleState(communityName));
  return (
    <>
      <IslandView plan={plan} state={state} />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center p-3">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/90 py-1.5 pl-4 pr-1.5 shadow-sm backdrop-blur">
          <span className="text-sm font-semibold text-slate-700">Example: {communityName}, finished</span>
          <button type="button" onClick={onBack} className="rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold text-white">
            Back to my village
          </button>
        </div>
      </div>
    </>
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
