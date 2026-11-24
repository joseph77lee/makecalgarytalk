import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { Group } from 'three';
import { VoxelPerson, type PersonMotion, clearCameraFocus, setCameraFocus, useHtmlPortal, useIslandWalkable, type Tile } from '../island-view';
import { useAvatarStore } from './avatarStore';
import { stepCandidates } from './keyboard';
import { usePressedKeys } from './usePressedKeys';
import { AvatarWalker } from './walker';

/** Walking speed in tiles per second (the player's own avatar is brisker than villagers). */
export const AVATAR_SPEED = 2.2;
const SPAWN: Tile = { x: 0, z: 0 };

interface Props {
  nickname: string;
  /** Shirt colour chosen on the first visit (Identity, §10.2). */
  shirtColor?: string;
}

/** The player's avatar: box character, name label, tap/click/keyboard movement (requirement.md §10.2). */
export function Avatar({ nickname, shirtColor = '#ff8a5c' }: Props) {
  // Hair and skin follow the nickname, so my villager keeps its look.
  const nickSeed = useMemo(() => [...nickname].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261), [nickname]);
  const { walkable, walkableKeys } = useIslandWalkable();
  const portal = useHtmlPortal();
  const walker = useRef<AvatarWalker | null>(null);
  walker.current ??= new AvatarWalker(SPAWN);
  const group = useRef<Group>(null);
  const body = useRef<Group>(null);
  const motion = useRef<PersonMotion>({ speed: 0 });
  const marker = useRef<Group>(null);
  const keys = usePressedKeys();

  // Keep the walker in sync with the island (growth, new houses, mood changes...).
  useEffect(() => {
    walker.current?.setWalkable(walkableKeys, walkable);
  }, [walkableKeys, walkable]);

  // Destination events → paths. Subscribed outside React rendering (no re-render per tap).
  useEffect(
    () =>
      useAvatarStore.subscribe((s, prev) => {
        {
          const e = s.lastEvent;
          // Skip events the walker created itself (keyboard steps).
          if (e && e !== prev.lastEvent && e.seq !== walker.current?.currentSeq) walker.current?.plan(e.to, e.seq);
        }
      }),
    [],
  );

  useEffect(() => clearCameraFocus, []);

  useFrame(({ camera, controls, clock }, rawDt) => {
    const w = walker.current;
    const g = group.current;
    if (!w || !g) return;
    const dt = Math.min(rawDt, 0.1);

    // Held keys: one grid step at a time, relative to the camera's rotation.
    if (keys.current.size > 0 && w.t >= 1 && w.path.length === 0) {
      const target = (controls as unknown as { target?: { x: number; z: number } } | null)?.target ?? { x: 0, z: 0 };
      const azimuth = Math.atan2(camera.position.x - target.x, camera.position.z - target.z);
      const store = useAvatarStore.getState();
      const seq = (store.lastEvent?.seq ?? 0) + 1;
      const next = w.tryStep(stepCandidates(keys.current, azimuth), seq);
      // Keyboard steps are destination events too (same format as taps).
      if (next) useAvatarStore.setState({ lastEvent: { avatarId: store.avatarId, to: next, seq, at: Date.now() } });
    }

    const f = w.update(dt, AVATAR_SPEED);
    if (f.arrivedSeq !== null) useAvatarStore.getState().reportArrival(f.arrivedSeq, w.tile);

    const time = clock.elapsedTime;
    const { workUntil, workFacing } = useAvatarStore.getState();
    const working = !f.moving && performance.now() < workUntil;
    g.position.set(f.x, f.moving ? Math.abs(Math.sin(time * 14)) * 0.05 : working ? Math.abs(Math.sin(time * 9)) * 0.08 : 0, f.z);
    if (working && workFacing) {
      const yaw = Math.atan2(workFacing.x + 0.5 - f.x, workFacing.z + 0.5 - f.z);
      let d = yaw - g.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      g.rotation.y += d * Math.min(1, dt * 12);
    }
    if (f.moving) {
      const targetYaw = Math.atan2(f.dx, f.dz);
      let diff = targetYaw - g.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      g.rotation.y += diff * Math.min(1, dt * 14);
    }
    if (body.current) body.current.rotation.x = working ? Math.max(0, Math.sin(time * 9)) * 0.15 : 0; // hammering bow
    // arms and legs follow the walk; while working the right arm swings the hammer
    motion.current.speed = f.moving ? AVATAR_SPEED : 0;
    motion.current.hammer = working;
    setCameraFocus(f.x, f.z);

    // Destination marker pulses while walking.
    const m = marker.current;
    if (m) {
      const dest = w.destination;
      m.visible = dest !== null;
      if (dest) {
        m.position.set(dest.x + 0.5, 0.02, dest.z + 0.5);
        const s = 0.85 + Math.sin(time * 6) * 0.1;
        m.scale.set(s, 1, s);
      }
    }
  });

  return (
    <>
      <group ref={group} position={[SPAWN.x + 0.5, 0, SPAWN.z + 0.5]}>
        <group ref={body}>
          <VoxelPerson seed={nickSeed} shirt={shirtColor} motion={motion} />
        </group>
        {/* My own name always shows (even with labels off), so I can find myself on screen. */}
        <Html portal={portal} position={[0, 1.05, 0]} center zIndexRange={[28, 21]} style={{ pointerEvents: 'none' }}>
          <span className="whitespace-nowrap rounded-full bg-orange-500 px-2 py-px text-[10px] font-bold text-white shadow-sm">
            {nickname}
          </span>
        </Html>
      </group>
      <group ref={marker} visible={false}>
        {[
          [0, -0.36, 0.72, 0.08],
          [0, 0.36, 0.72, 0.08],
          [-0.36, 0, 0.08, 0.72],
          [0.36, 0, 0.08, 0.72],
        ].map(([x, z, w, d]) => (
          <mesh key={`${x},${z}`} position={[x, 0, z]}>
            <boxGeometry args={[w, 0.03, d]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
          </mesh>
        ))}
      </group>
    </>
  );
}
