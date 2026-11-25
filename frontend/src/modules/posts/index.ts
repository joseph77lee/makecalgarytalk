// Public API of the `posts` module (M15). Other modules import ONLY from here.
export { LocalNews } from './LocalNews';
export { isCanPost, isPost, type CanPost, type Post } from './api';
export { postBubbles, postBubbleText, type PostBubble } from './bubbles';
