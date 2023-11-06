import { postState, Post } from "@/atoms/postsAtom";
import { deleteObject, ref } from "firebase/storage";
import React from "react";
import { useRecoilState } from "recoil";
import { db, storage } from "../firebase/firebase.config";
import { FIREBASE_DB_NAME, StateProps } from "../../type";
import { collection, deleteDoc, doc, writeBatch } from "firebase/firestore";

const usePosts = () => {
  const [postStateValue, setPostStateValue] = useRecoilState(postState);

  const onVote = async (post: Post, vote: number, boardId: string) => {
    // check for a user => if not, redirect to auth

    try {
      const { voteStatus } = post;
      const existingVote = postStateValue.postVotes.find((vote) => vote.postId === post.id);
      const batch = writeBatch(db);
      const updatedPost = { ...post };
      const updatedPosts = [...postStateValue.posts];
      const updatedPostVotes = [...postStateValue.postVotes];
      let voteChange = vote;

      // New Vote
      if (!existingVote) {
        // add/substract 1 to/from post.voteStatus
        const postVoteRef = doc(collection(db, ''))
        // create a new postVote document

      } else {
        //Existing vote - they have voted on the post before

        //Rmoveing their vote (up => newtraul OR down => newtral)
        // if (removingVote) {

        // } else {
        // Flipping their vote (up => down OR down => up)
        // add/substract 2 to/from post.voteStatus
        // updating the existing postVote document

        // }
      }

      // update state with updated values
    } catch (error: any) {
      console.log('onVote error', error);
    }

  };

  const onSelectPost = () => { };

  const onDeletePost = async (post: Post): Promise<boolean> => {
    try {
      // check if image, delete if exists
      if (post.imageUrl) {
        const imageRef = ref(storage, `${FIREBASE_DB_NAME.FREEBOARD}/${post.id}/${post.filename}`);
        await deleteObject(imageRef);
      }
      // delte post document from firestore
      const postDocRef = doc(db, FIREBASE_DB_NAME.FREEBOARD, post.id!);
      await deleteDoc(postDocRef);

      //update recoil state
      setPostStateValue((prev) => ({
        ...prev,
        posts: prev.posts.filter((item) => item.id !== post.id),
      }))

      return true;
    } catch (error: any) {
      return false;

    }
  };

  return {
    postStateValue,
    setPostStateValue,
    onVote,
    onSelectPost,
    onDeletePost,
  };
};

export default usePosts;
