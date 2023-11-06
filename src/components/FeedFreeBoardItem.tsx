import { Post } from "@/atoms/postsAtom";
import React, { useState } from "react";
import {
  AiOutlineDelete,
  AiOutlineLike,
  AiOutlineDislike,
  AiFillLike,
  AiFillDislike,
} from "react-icons/ai";
import { BsChat, BsDot } from "react-icons/bs";
import { FaReddit, FaUserCircle } from "react-icons/fa";
import {
  IoArrowDownCircleOutline,
  IoArrowDownCircleSharp,
  IoArrowRedoOutline,
  IoArrowUpCircleOutline,
  IoArrowUpCircleSharp,
  IoBookmarkOutline,
} from "react-icons/io5";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useSelector } from "react-redux";
import { StateProps } from "../../type";
import moment from "moment";

type FeedFreeBoardItemProps = {
  post: Post;
  userIsCreator: boolean;
  userVoteValue?: number;
  onVote: () => {};
  onDeletePost: (post: Post) => Promise<boolean>;
  onSelectPost: () => void;
};

const FeedFreeBoardItem: React.FC<FeedFreeBoardItemProps> = ({
  post,
  userIsCreator,
  userVoteValue,
  onVote,
  onDeletePost,
  onSelectPost,
}) => {
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [error, setError] = useState(false);
  const handleDelete = async () => {
    setLoadingDelete(true);
    try {
      const success = await onDeletePost(post);

      if (!success) {
        throw new Error("Failed to delte posts");
      }

      console.log("Post was successfully deleted");
    } catch (error: any) {
      setError(error.message);
    }
    setLoadingDelete(false);
  };

  return (
    <div className="mt-8 p-8 bg-white rounded-md shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {post.creatorImage ? (
            <img
              src={post.creatorImage}
              alt="userImage"
              className="w-8 h-8 rounded-full object-cover mr-2"
            />
          ) : (
            <FaUserCircle className="text-gray-600 w-8 h-8 mr-2" />
          )}
          <div>
            <p className="text-gray-800 font-semibold">{post.creatorName}</p>
            <p className="text-gray-500 text-sm">
              Posted{" "}
              {moment(new Date(post.createdAt?.seconds * 1000)).fromNow()}
            </p>
          </div>
        </div>
        {userIsCreator && (
          <div className="text-gray-500 cursor-pointer">
            <button
              onClick={handleDelete}
              className="hover:bg-gray-50 rounded-full p-1">
              <BsThreeDotsVertical />
            </button>
          </div>
        )}
      </div>
      {post.imageUrl ? (
        <div className="mb-4">
          <img
            src={post.imageUrl}
            alt="Post Image"
            className="w-full h-full object-cover rounded-md"
          />
        </div>
      ) : (
        <></>
      )}
      <div className="mb-4">
        <p className="text-gray-700">{post.content}</p>
      </div>
      <div className="flex items-center justify-between text-gray-500">
        <div className="flex items-center space-x-2">
          <button
            onClick={onVote}
            className="flex justify-center items-center gap-2 px-2 hover:bg-gray-50 rounded-full p-1">
            {userVoteValue ? (
              <AiOutlineLike className="w-5 h-5" />
            ) : (
              <AiFillLike className="w-5 h-5" />
            )}
          </button>
          <span>{userVoteValue}</span>
          <button className="flex justify-center items-center gap-2 px-2 hover:bg-gray-50 rounded-full p-1">
            {userVoteValue ? (
              <AiOutlineDislike className="w-5 h-5" />
            ) : (
              <AiFillDislike className="w-5 h-5" />
            )}
          </button>
        </div>
        <button className="flex justify-center items-center gap-2 px-2 hover:bg-gray-50 rounded-full p-1">
          <BsChat />
          <span>{post.numberOfComments}</span>
        </button>
      </div>
      <hr className="mt-2 mb-2" />
      <p className="text-gray-800 font-semibold">Comment</p>
      <hr className="mt-2 mb-2" />
      <div className="mt-4">
        <div className="flex items-center space-x-2">
          <img
            src="https://placekitten.com/32/32"
            alt="User Avatar"
            className="w-6 h-6 rounded-full"
          />
          <div>
            <p className="text-gray-800 font-semibold">Jane Smith</p>
            <p className="text-gray-500 text-sm">Lovely shot! 📸</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-2">
          <img
            src="https://placekitten.com/32/32"
            alt="User Avatar"
            className="w-6 h-6 rounded-full"
          />
          <div>
            <p className="text-gray-800 font-semibold">Bob Johnson</p>
            <p className="text-gray-500 text-sm">
              I cant handle the cuteness! Where can I get one?
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-2 ml-6">
          <img
            src="https://placekitten.com/40/40"
            alt="User Avatar"
            className="w-6 h-6 rounded-full"
          />
          <div>
            <p className="text-gray-800 font-semibold">John Doe</p>
            <p className="text-gray-500 text-sm">
              That little furball is from a local shelter. You should check it
              out! 🏠😺
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedFreeBoardItem;
