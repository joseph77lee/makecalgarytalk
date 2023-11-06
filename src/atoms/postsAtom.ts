import { Timestamp } from "firebase-admin/firestore";
import { atom } from "recoil";

export type Post = {
  id: string,
  creatorName: string,
  creatorId: string;
  creatorImage: string;
  creatorDisplayName: string;
  title: string;
  content: string;
  numberOfComments: number;
  voteStatus: number;
  imageUrl?: string;
  filename?: string;
  createdAt: Timestamp;
}

export type PostVote = {
  id: string;
  postId: string;
  boardId: string;
  voteValue: number;
}

interface PostState {
  selectedPost: Post | null;
  posts: Post[];
  postVotes: PostVote[];
}

const defaultPostState: PostState = {
  selectedPost: null,
  posts: [],
  postVotes: [],
};

export const postState = atom<PostState>({
  key: 'postState',
  default: defaultPostState
})
