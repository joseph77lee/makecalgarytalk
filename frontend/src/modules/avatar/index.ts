// Public API of the `avatar` module (M2). Other modules import ONLY from here.
export { Avatar, AVATAR_SPEED } from './Avatar';
export { moveTo, useAvatarStore, type DestinationEvent } from './avatarStore';
export { findPath, nearestWalkable } from './pathfinding';
