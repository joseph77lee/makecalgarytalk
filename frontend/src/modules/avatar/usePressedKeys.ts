import { useEffect, useRef } from 'react';
import { moveKeyOf, type MoveKey } from './keyboard';

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName));

/** Movement keys currently held (a ref, read inside useFrame; never React state). */
export function usePressedKeys() {
  const keys = useRef(new Set<MoveKey>());
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = moveKeyOf(e.code);
      if (!k || isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      keys.current.add(k);
    };
    const up = (e: KeyboardEvent) => {
      const k = moveKeyOf(e.code);
      if (k) keys.current.delete(k);
    };
    const clear = () => keys.current.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
    };
  }, []);
  return keys;
}
