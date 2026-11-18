import { Avatar, moveTo } from '../modules/avatar';
import { IslandDevPanel, IslandHud, IslandView, useMockCommunityStore } from '../modules/island-view';

const showDevTools = import.meta.env.DEV || new URLSearchParams(window.location.search).has('dev');

/** App shell. M2: the community island (mock state) with the player's avatar. */
export function App() {
  const state = useMockCommunityStore((s) => s.state);

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <IslandView state={state} onTileTap={moveTo}>
        {/* Nickname comes from Identity (M6); a placeholder until then. */}
        <Avatar nickname="You" />
      </IslandView>
      <IslandHud state={state} />
      {showDevTools && <IslandDevPanel />}
    </main>
  );
}
