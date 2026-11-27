// Public API of the `avatar` module (M2). Other modules import ONLY from here.
export { Avatar, AVATAR_SPEED } from './Avatar';
export { moveTo, playWork, useAvatarStore, type DestinationEvent } from './avatarStore';
export { findPath, nearestWalkable } from './pathfinding';
export { AvatarPreview } from './AvatarPreview';
export { currentLook, nicknameSeed } from './look';
export { AvatarFace } from './AvatarFace';
