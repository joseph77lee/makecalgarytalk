import { IslandDevPanel, IslandHud, IslandView, useMockCommunityStore } from '../modules/island-view';

const showDevTools = import.meta.env.DEV || new URLSearchParams(window.location.search).has('dev');

/** App shell. M1: the community island rendered from mock state. */
export function App() {
  const state = useMockCommunityStore((s) => s.state);

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <IslandView state={state} />
      <IslandHud state={state} />
      {showDevTools && <IslandDevPanel />}
    </main>
  );
}
