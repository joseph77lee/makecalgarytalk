import { useEffect, useState } from 'react';
import { Avatar, moveTo } from '../modules/avatar';
import { BuildMap, ChangesPanel, StreakBar, changesPanelOpen } from '../modules/community-state';
import { ActionBar, CommunityPicker, SessionScreen, Toast, useDailyActions } from '../modules/daily-actions';
import { FirstVisit, IdentityScreen, ProfileButton, shirtColor, useIdentity } from '../modules/identity';
import { InviteFab, InviteLandingBanner, InviteSection, WelcomeCard, inviteNudge, shareOutcomeText, useInvites } from '../modules/invites';
import { NewspaperPanel, newsBuildingKeys, newsReady, useNews } from '../modules/news';
import { FindCommunity, MoveSection, ResidencyChip, useResidency } from '../modules/residency';
import {
  IslandDevPanel,
  IslandHud,
  IslandView,
  finishedExampleState,
  vitalityMood,
  useMockCommunityStore,
  type CommunityViewState,
  type IslandPlan,
} from '../modules/island-view';

const params = new URLSearchParams(window.location.search);
/** `?mock` shows the M1 mock island with its dev panel (no server needed). */
const mockMode = params.has('mock');

export function App() {
  return mockMode ? <MockApp /> : <IdentityGate />;
}

/** Signs the player in (anonymous + Turnstile) and runs the first visit before the game starts. */
function IdentityGate() {
  const status = useIdentity((s) => s.status);
  const init = useIdentity((s) => s.init);
  useEffect(() => {
    void init();
  }, [init]);
  if (status === 'ready') return <LiveApp />;
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-gradient-to-b from-sky-100 to-indigo-50">
      <FirstVisit banner={<InviteLandingBanner />} />
      <IdentityScreen />
    </main>
  );
}

/** The real game: community state from the server, daily actions. */
function LiveApp() {
  const status = useDailyActions((s) => s.status);
  const server = useDailyActions((s) => s.server);
  const view = useDailyActions((s) => s.view);
  const [mapOpen, setMapOpen] = useState(false);
  const [example, setExample] = useState(false);
  const changesSeen = useIdentity((s) => s.changesSeenToday);
  const markChangesSeen = useIdentity((s) => s.markChangesSeen);
  const plan = useDailyActions((s) => s.plan);
  const init = useDailyActions((s) => s.init);
  const openLookAround = useDailyActions((s) => s.openLookAround);
  const residencyStatus = useResidency((s) => s.status?.status);
  const welcomedIds = useInvites((s) => s.welcomedIds);
  useEffect(() => {
    void init();
    void useResidency.getState().init();
    void useInvites.getState().init();
    // Where the player plays comes from Residency: reload the game when it changes
    // (first check-in, verification, move started/completed/cancelled).
    return useResidency.subscribe((s, prev) => {
      const key = (r: typeof s.status) => (r ? `${r.play_community?.id ?? ''}:${r.pending}` : null);
      if (prev.status && key(s.status) !== key(prev.status)) {
        void useDailyActions.getState().reload();
        void useInvites.getState().reload(); // badges change with verifications
      }
    });
  }, [init]);

  const invite = () => {
    const name = server?.me?.member ? server.community.name : null;
    void useInvites
      .getState()
      .invite(name)
      .then((o) => {
        const text = shareOutcomeText(o);
        if (text) useDailyActions.getState().showToast(text);
      });
  };
  // A nudge for the floating Invite button at a good moment (closest goal wins).
  const closest = view?.buildings
    .filter((b) => b.status === 'locked' && b.remaining && b.remaining.residents > 0)
    .sort((x, y) => (x.remaining?.residents ?? 0) - (y.remaining?.residents ?? 0))[0];
  const nudge = server
    ? inviteNudge({
        nextLandResidents: server.community.next_land_residents,
        closestBuildingResidents: closest?.remaining?.residents ?? null,
        closestBuildingTitle: closest?.title ?? null,
        builtSinceYesterday: server.changes.built[0]?.title ?? null,
        landGrew: server.changes.land_grew,
      })
    : null;
  const panelOpen = !!server && changesPanelOpen(server.changes, server.community.vitality, changesSeen);
  // Welcome card right after the first counted check-in (§5.1), once per community.
  const showWelcome =
    status === 'ready' &&
    !!server?.me?.member &&
    server.me.pending &&
    (residencyStatus === 'verifying' || residencyStatus === 'moving') &&
    !welcomedIds.includes(server.community.id);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-gradient-to-b from-sky-100 to-indigo-50">
      {example && view && plan ? (
        <ExampleView plan={plan} communityName={view.communityName} onBack={() => setExample(false)} />
      ) : (
        <>
          {view && plan && server && (
            <Island
              plan={plan}
              state={view}
              showAvatar={server.me?.member === true}
              newsBuildings={(() => {
                const built = view.buildings.filter((b) => b.status === 'built' || b.level > 1).map((b) => b.key);
                return newsReady(built) ? newsBuildingKeys(built) : [];
              })()}
              onBuildingTap={(key) => {
                // The newspaper lives on the Welcome sign's lot, later the Community hall (§7.6, §11);
                // tapping the sign's construction site says it opens once the sign is built.
                if (['welcome-sign', 'gateway-arch', 'community-hall'].includes(key)) void useNews.getState().show(server.community.id);
              }}
            />
          )}
          {view && (
            <IslandHud
              state={view}
              left={
                <ProfileButton>
                  <MoveSection />
                  <InviteSection onInvite={invite} />
                </ProfileButton>
              }
            />
          )}
          {status === 'ready' && server && (
            <>
              <StreakBar
                streak={server.streak}
                nextLandResidents={server.community.next_land_residents}
                onOpenMap={() => setMapOpen(true)}
                onInvite={server.me?.member ? invite : undefined}
                sleepyName={server.community.vitality !== null && vitalityMood(server.community.vitality) === 'sleepy' ? server.community.name : null}
              >
                <ResidencyChip />
              </StreakBar>
              <ActionBar />
              {server.me?.member && !showWelcome && (
                // Remounts when the changes panel closes, so the nudge is not shown behind it.
                <InviteFab
                  key={panelOpen ? 'behind-panel' : 'visible'}
                  calgaryDay={server.calgary_day}
                  nudge={panelOpen ? null : nudge}
                  onInvite={invite}
                />
              )}
              {showWelcome ? (
                <WelcomeCard
                  communityId={server.community.id}
                  communityName={server.community.name}
                  residents={server.community.residents}
                  nextLandResidents={server.community.next_land_residents}
                  onInvite={invite}
                />
              ) : (
                <ChangesPanel changes={server.changes} vitality={server.community.vitality} seen={changesSeen} onSeen={markChangesSeen} />
              )}
            </>
          )}
          {mapOpen && server && view && (
            <BuildMap
              community={server.community}
              streakDays={server.streak.days}
              buildings={view.buildings}
              onClose={() => setMapOpen(false)}
              onInvite={server.me?.member ? invite : undefined}
              extraResidents={server.hidden_houses}
              onShowExample={() => {
                setMapOpen(false);
                setExample(true);
              }}
            />
          )}
        </>
      )}
      {status === 'no-community' && residencyStatus === 'new' && <FindCommunity onLookAround={() => void openLookAround()} />}
      <CommunityPicker />
      <NewspaperPanel />
      <SessionScreen />
      <Toast />
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

/** My avatar walks only in the community I play in (not while looking around elsewhere). */
function Island({
  plan,
  state,
  showAvatar = true,
  newsBuildings = [],
  onBuildingTap,
}: {
  plan: IslandPlan;
  state: CommunityViewState;
  showAvatar?: boolean;
  newsBuildings?: string[];
  onBuildingTap?: (key: string) => void;
}) {
  const profile = useIdentity((s) => s.profile);
  return (
    <IslandView plan={plan} state={state} onTileTap={showAvatar ? moveTo : undefined} onBuildingTap={onBuildingTap} newsBuildingKeys={newsBuildings}>
      {showAvatar && <Avatar nickname={profile?.nickname ?? 'You'} shirtColor={shirtColor(profile?.shirt)} />}
    </IslandView>
  );
}
