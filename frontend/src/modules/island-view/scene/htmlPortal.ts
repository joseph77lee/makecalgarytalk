import { useThree } from '@react-three/fiber';
import { useMemo } from 'react';

/**
 * A fixed container for drei `Html` overlays. Without one, drei appends to `events.connected`,
 * which can change right after the first render; Html then rebuilds its React root and the old
 * root's deferred unmount can leave the overlay empty ("Attempted to synchronously unmount a
 * root while React was already rendering"). Pass the result as `<Html portal={...}>`.
 */
export function useHtmlPortal(): { current: HTMLElement } | undefined {
  const container = useThree((s) => s.gl.domElement.parentNode as HTMLElement | null);
  return useMemo(() => (container ? { current: container } : undefined), [container]);
}
