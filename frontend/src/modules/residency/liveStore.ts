/** The app's residency store, wired to Supabase and the browser's location. */
import { getSupabaseClient, readSupabaseConfig } from '../common';
import { devLocationFromSearch, devPosition } from './devLocation';
import { getPosition, locationGranted } from './geolocation';
import { createResidencyStore } from './store';

const devLocation = import.meta.env.DEV ? devLocationFromSearch(window.location.search) : null;

export const useResidency = createResidencyStore({
  getClient: () => {
    const cfg = readSupabaseConfig();
    return cfg.ok ? getSupabaseClient(cfg.config) : null;
  },
  getPosition: () =>
    // `import.meta.env.DEV &&` lets production builds drop the dev boundaries file entirely.
    import.meta.env.DEV && devLocation ? devPosition(devLocation) : getPosition({ isSecureContext: window.isSecureContext, geolocation: navigator.geolocation }),
  locationGranted: async () => devLocation !== null || (await locationGranted()),
});
