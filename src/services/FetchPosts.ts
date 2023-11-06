import { FIREBASE_DB_NAME, StateProps } from "../../type";
import { db } from "../firebase/firebase.config";
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
} from "firebase/firestore";
import { Post } from "@/atoms/postsAtom";
import { Timestamp } from "firebase-admin/firestore";

const postsFirstBatch = async () => {
  try {
    const postQuery = query(
      collection(db, FIREBASE_DB_NAME.FREEBOARD),
      orderBy("createdAt", "desc"),
      limit(2)
    );

    const postDocs = await getDocs(postQuery);
    let posts: Post[] = [];
    let lastKey = "";
    postDocs.docs.forEach(
      (doc) => {

        posts.push({
          id: doc.id,
          ...doc.data(),
        } as Post);
        lastKey = doc.data().createdAt;
      }
    );
    return { posts, lastKey };
  } catch (e) {
    console.log(e);
  }
}

const postsNextBatch = async (key: Timestamp) => {
  try {
    const postQuery = query(
      collection(db, FIREBASE_DB_NAME.FREEBOARD),
      orderBy("createdAt", "desc"),
      startAfter(key),
      limit(2)
    );

    const postDocs = await getDocs(postQuery);
    let posts: Post[] = [];
    let lastKey = "";
    postDocs.docs.forEach(
      (doc) => {

        posts.push({
          id: doc.id,
          ...doc.data(),
        } as Post);
        lastKey = doc.data().createdAt;
      }
    );
    return { posts, lastKey };
  } catch (e) {
    console.log(e);
  }
}

export { postsFirstBatch, postsNextBatch };