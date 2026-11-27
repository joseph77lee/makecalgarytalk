import { useEffect, useState } from 'react';
import { Avatar, moveTo } from '../modules/avatar';
import { BuildMap, ChangesPanel, StreakBar, changesPanelOpen, isLandmarkKey, type ChangeCard, type ChangeItem } from '../modules/community-state';
import { ActionBar, SessionScreen, Toast, useDailyActions, type ServerCommunityState } from '../modules/daily-actions';
import { mockResidents, mockServerBuildings } from './mockBuildMap';
import { FirstVisit, IdentityScreen, ProfileButton, shirtColor, useIdentity } from '../modules/identity';
import { AdminDashboard } from '../modules/admin';
import { track } from '../modules/analytics';
import { InviteFab, InviteLandingBanner, InviteSection, WelcomeCard, arrivedByInvite, inviteNudge, shareOutcomeText, useInvites } from '../modules/invites';
import { installSound, playSound } from '../modules/sound';
import { NewspaperPanel, newsBuildingKeys, newsReady, useNews, useTodayPostBubbles } from '../modules/news';
import { FindCommunity, MoveSection, ResidencyChip, useResidency } from '../modules/residency';
import { useRanking, weeklyAnnouncement, weeklyCardTitle } from '../modules/ranking';
import { ShareCardDialog, type ShareCard } from '../modules/share-cards';
import { WorldMap } from '../modules/world-map';
import {
  AssetGallery,
  PicturePrinter,
  IslandDevPanel,
  IslandHud,
  IslandView,
  captureIsland,
  finishedExampleState,
  requestLookAt,
  celebrateNewBuilding,
  upcomingIdentity,
  useMockCommunityStore,
  type CommunityViewState,
  type IslandPlan,
} from '../modules/island-view';

const params = new URLSearchParams(window.location.search);
/** `?mock` shows the M1 mock island with its dev panel (no server needed). */
const mockMode = params.has('mock');
/** `?admin` shows the operator dashboard (operators only, checked by the server). */
const adminMode = params.has('admin');

/** `?gallery` shows the Art Pass style samples (M19), no sign-in needed. */
const galleryMode = params.has('gallery');
/** `?pictures` (dev server only) prints the build map's static pictures. */
const picturesMode = import.meta.env.DEV && params.has('pictures');

export function App() {
  // sound starts on the first tap and pauses while the page is hidden (§10.5)
  useEffect(() => installSound(), []);
  if (galleryMode) return <AssetGallery />;
  if (picturesMode) return <PicturePrinter />;
  return mockMode ? <MockApp /> : <IdentityGate />;
}

/** Signs the player in (anonymous + Turnstile) and runs the first visit before the game starts. */
function IdentityGate() {
  const status = useIdentity((s) => s.status);
  const init = useIdentity((s) => s.init);
  useEffect(() => {
    void init();
  }, [init]);
  if (status === 'ready') return adminMode ? <AdminDashboard /> : <LiveApp />;
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
  // "Help build it today" on the build map points at that construction in the action bar for a while.
  const [helpKey, setHelpKey] = useState<string | null>(null);
  useEffect(() => {
    if (!helpKey) return;
    const t = setTimeout(() => setHelpKey(null), 6000);
    return () => clearTimeout(t);
  }, [helpKey]);
  const [worldOpen, setWorldOpen] = useState(false);
  const myCommunityId = useResidency((s) => s.status?.play_community?.id ?? null);
  const [example, setExample] = useState(false);
  const changesSeen = useIdentity((s) => s.changesSeenToday);
  const markChangesSeen = useIdentity((s) => s.markChangesSeen);
  const plan = useDailyActions((s) => s.plan);
  const init = useDailyActions((s) => s.init);
  const residencyStatus = useResidency((s) => s.status?.status);
  const welcomedIds = useInvites((s) => s.welcomedIds);
  const ranking = useRanking((s) => s.data);
  const [shareCard, setShareCard] = useState<{ card: ShareCard; island: HTMLCanvasElement | null } | null>(null);
  const member = server?.me?.member === true;
  const homeId = member ? server?.community.id : undefined;
  // Own analytics (§21): today's visit and the community on screen; an invite-link arrival once.
  const shownCode = server?.community.code ?? null;
  useEffect(() => {
    if (status === 'ready') track.visit(shownCode);
  }, [status, shownCode]);
  useEffect(() => {
    if (arrivedByInvite) track.inviteVisit();
  }, []);
  useEffect(() => {
    // Monday: last week's result for "Since yesterday" (§12.1). Cached on the server.
    if (homeId) void useRanking.getState().load();
  }, [homeId]);
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
        if (o === 'shared' || o === 'copied') track.share('invite');
        const text = shareOutcomeText(o);
        if (text) useDailyActions.getState().showToast(text);
      });
  };
  // A nudge for the floating Invite button at a good moment (closest goal wins).
  const waiting = (landmark: boolean) =>
    server?.buildings
      .filter((b) => b.status === 'locked' && b.remaining && b.remaining.residents > 0 && isLandmarkKey(b.key) === landmark)
      .sort((x, y) => (x.remaining?.residents ?? 0) - (y.remaining?.residents ?? 0))[0];
  const closest = waiting(false);
  const closestLandmark = waiting(true);
  const nudge = server
    ? inviteNudge({
        nextLandResidents: server.community.next_land_residents,
        closestBuildingResidents: closest?.remaining?.residents ?? null,
        closestBuildingTitle: closest?.name ?? null,
        closestLandmarkResidents: closestLandmark?.remaining?.residents ?? null,
        closestLandmarkTitle: closestLandmark?.name ?? null,
        builtSinceYesterday: server.changes.built[0]?.title ?? null,
        landGrew: server.changes.land_grew,
      })
    : null;
  // Share cards always name the community; the island picture only when it is that community's island.
  const openCard = (c: ChangeCard, communityName: string) =>
    setShareCard({ card: { ...c, communityName }, island: server?.community.name === communityName ? captureIsland() : null });
  const weekly = member && ranking?.home?.code === server?.community.code ? weeklyAnnouncement(ranking) : null;
  const extraChanges: ChangeItem[] = weekly ? [{ icon: '🏆', text: weekly.text, card: { kind: 'weekly', title: weeklyCardTitle(weekly.rank) } }] : [];
  const panelOpen = !!server?.me?.member && changesPanelOpen(server.changes, changesSeen, extraChanges);
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
              communityId={server.community.id}
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
              right={
                <button
                  type="button"
                  onClick={() => setWorldOpen(true)}
                  aria-label="Calgary map"
                  title="Calgary map"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-lg shadow-sm backdrop-blur"
                >
                  🗺️
                </button>
              }
            />
          )}
          {status === 'ready' && server && (
            <>
              <StreakBar
                streak={server.streak}
                nextLandResidents={server.community.next_land_residents}
                onOpenMap={() => {
                  playSound('ui-click');
                  setMapOpen(true);
                }}
                onInvite={server.me?.member ? invite : undefined}
              >
                <ResidencyChip />
                {!server.me?.member && myCommunityId && (
                  <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-slate-800/85 py-1.5 pl-3 pr-1.5 text-xs text-white shadow-sm backdrop-blur">
                    <span>👀 Visiting {server.community.name}</span>
                    <button
                      type="button"
                      onClick={() => void useDailyActions.getState().reload()}
                      className="rounded-full bg-white px-2.5 py-1 font-semibold text-slate-800"
                    >
                      Back home
                    </button>
                  </div>
                )}
              </StreakBar>
              <ActionBar highlightKey={helpKey} />
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
                // Only in my own community (visiting elsewhere must not use up today's panel).
                server.me?.member && (
                  <ChangesPanel
                    changes={server.changes}
                    seen={changesSeen}
                    extra={extraChanges}
                    onShare={(c) => openCard(c, server.community.name)}
                    onSeen={() => {
                      // A new building is celebrated on the island once the panel closes (§7.4).
                      if (server.changes.built.length > 0) celebrateNewBuilding();
                      markChangesSeen();
                    }}
                  />
                )
              )}
            </>
          )}
          {mapOpen && server && view && (
            <BuildMap
              community={server.community}
              streakDays={server.streak.days}
              buildings={server.buildings}
              onClose={() => {
                playSound('ui-close');
                setMapOpen(false);
              }}
              onInvite={server.me?.member ? invite : undefined}
              onHelp={
                server.me?.member
                  ? (key) => {
                      setMapOpen(false);
                      setHelpKey(key);
                    }
                  : undefined
              }
              onSeeOnIsland={(key) => {
                setMapOpen(false);
                requestLookAt(key);
              }}
              upcoming={plan ? upcomingIdentity(plan, server.community.land_stage) : null}
              onShowExample={() => {
                setMapOpen(false);
                setExample(true);
              }}
            />
          )}
        </>
      )}
      {status === 'no-community' && residencyStatus === 'new' && !worldOpen && <FindCommunity onLookAround={() => setWorldOpen(true)} />}
      {worldOpen && (
        <WorldMap
          myCommunityId={myCommunityId}
          onClose={() => setWorldOpen(false)}
          onShareLastWeek={(e) => e.rank !== null && openCard({ kind: 'weekly', title: weeklyCardTitle(e.rank) }, e.name)}
          onEnter={(id) => {
            setWorldOpen(false);
            if (id !== server?.community.id) void useDailyActions.getState().viewCommunity(id);
          }}
          onInvite={(name) =>
            void useInvites
              .getState()
              .invite(name, 'start')
              .then((o) => {
                const text = shareOutcomeText(o);
                if (text) useDailyActions.getState().showToast(text);
              })
          }
        />
      )}
      {shareCard && (
        <ShareCardDialog
          card={shareCard.card}
          island={shareCard.island}
          onClose={() => setShareCard(null)}
          onResult={(m) => m && useDailyActions.getState().showToast(m)}
          onShared={(kind) => track.share(kind)}
        />
      )}
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
  const [mapOpen, setMapOpen] = useState(false);
  const [example, setExample] = useState(false);
  useEffect(() => {
    // `?mock&plan=BLN` shows another community's real shape.
    void loadPlan(params.get('plan') ?? undefined);
  }, [loadPlan]);
  // `?mock&streak=14`: the community streak the mock build map assumes
  const streakDays = Number(params.get('streak') ?? 7);
  const residents = mockResidents(state.landStage);
  if (example && plan) return <ExampleView plan={plan} communityName={plan.name} onBack={() => setExample(false)} />;
  return (
    <main className="relative h-dvh w-full overflow-hidden">
      {plan && <Island plan={plan} state={state} />}
      <IslandHud
        state={state}
        right={
          <button type="button" onClick={() => setMapOpen(true)} aria-label="Build map" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-lg shadow-sm backdrop-blur">
            🌳
          </button>
        }
      />
      <IslandDevPanel />
      {mapOpen && plan && (
        <BuildMap
          community={
            {
              id: 'mock',
              code: plan.code,
              name: plan.name,
              residents,
              land_stage: state.landStage,
              settled: true,
              level: 0,
              persona: plan.persona,
              vitality: state.vitality,
              mini_villagers: state.miniVillagerCount,
              next_land_residents: null,
            } as ServerCommunityState['community']
          }
          streakDays={streakDays}
          buildings={mockServerBuildings(plan, state, streakDays)}
          onClose={() => setMapOpen(false)}
          onShowExample={() => {
            setMapOpen(false);
            setExample(true);
          }}
          onHelp={() => setMapOpen(false)}
          onSeeOnIsland={(key) => {
            setMapOpen(false);
            requestLookAt(key);
          }}
          upcoming={upcomingIdentity(plan, state.landStage)}
        />
      )}
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
  communityId = null,
}: {
  plan: IslandPlan;
  state: CommunityViewState;
  /** Community shown (today's local posts ride on the mini villagers, §7.3); null in previews. */
  communityId?: string | null;
  showAvatar?: boolean;
  newsBuildings?: string[];
  onBuildingTap?: (key: string) => void;
}) {
  const profile = useIdentity((s) => s.profile);
  const postBubbles = useTodayPostBubbles(communityId);
  return (
    <IslandView
      plan={plan}
      state={state}
      onTileTap={showAvatar ? moveTo : undefined}
      onBuildingTap={onBuildingTap}
      newsBuildingKeys={newsBuildings}
      postBubbles={postBubbles}
      onPostTap={communityId ? () => void useNews.getState().show(communityId) : undefined}
    >
      {showAvatar && <Avatar nickname={profile?.nickname ?? 'You'} shirtColor={shirtColor(profile?.shirt)} />}
    </IslandView>
  );
}
