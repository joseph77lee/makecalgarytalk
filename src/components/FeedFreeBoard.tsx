import { FIREBASE_DB_NAME, StateProps } from "../../type";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
} from "firebase/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { db } from "../firebase/firebase.config";
import usePosts from "@/hooks/usePosts";
import { Post } from "@/atoms/postsAtom";
import FeedFreeBoardItem from "./FeedFreeBoardItem";
import { useSelector } from "react-redux";

const FeedFreeBoard = () => {
  const { userInfo } = useSelector((state: StateProps) => state.calgary);
  const [loading, setLoading] = useState(false);
  const [firstCreatedAt, setFirstCreatedAt] = useState();
  const [lastCreatedAt, setLastCreatedAt] = useState();
  const {
    postStateValue,
    setPostStateValue,
    onVote,
    onDeletePost,
    onSelectPost,
  } = usePosts();

  const getFreeBoardPosts = async (lastCreatedAt?: Timestamp) => {
    try {
      const postQuery = query(
        collection(db, FIREBASE_DB_NAME.FREEBOARD),
        orderBy("createdAt", "desc"),
        startAfter(lastCreatedAt || new Date(253402300799999)),
        limit(2)
      );
      const postDocs = await getDocs(postQuery);
      const posts = postDocs.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Post)
      );
      console.log("posts-->", posts);
      setPostStateValue((prev) => ({
        ...prev,
        posts: posts as Post[],
      }));
    } catch (error: any) {
      console.log("getFreeBoardPosts error", error.message);
    }
  };

  useEffect(() => {
    getFreeBoardPosts();
  }, []);

  return (
    <>
      {/* {postStateValue.posts.map((item) => (
        <FeedFreeBoardItem
          key={item.id}
          post={item}
          userIsCreator={userInfo?.uid === item.creatorId}
          userVoteValue={undefined}
          onVote={onVote}
          onSelectPost={onSelectPost}
          onDeletePost={onDeletePost}
        />
      ))} */}
    </>
  );
};

export default FeedFreeBoard;
