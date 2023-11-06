/* eslint-disable @next/next/no-img-element */
import React, { ChangeEvent, useRef, useState } from "react";
import { MdOutlinePhotoLibrary } from "react-icons/md";
import { MdOutlineClose } from "react-icons/md";
import { FaUserCircle } from "react-icons/fa";
import { BeatLoader } from "react-spinners";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db, storage } from "../firebase/firebase.config";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { StateProps, FIREBASE_DB_NAME } from "../../type";
import { useSelector } from "react-redux";

const PostFreeBoard = () => {
  const { userInfo } = useSelector((state: StateProps) => state.calgary);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [filename, setFilename] = useState("");
  const [selectedFile, setSelectedFile] = useState<any>();
  const [loading, setLoading] = useState(false);
  const fPicker = useRef<HTMLInputElement>(null);

  const addImageToPost = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedImages = e.target.files as FileList;
    if (selectedImages && selectedImages[0]) {
      const reader = new FileReader();
      reader.readAsDataURL(selectedImages[0]);
      setFilename(selectedImages[0].name);
      reader.onload = (readerEvent: ProgressEvent<FileReader>) => {
        if (readerEvent?.target?.result) {
          setSelectedFile(readerEvent.target.result);
        }
      };
    } else {
      console.log("File not selected");
    }
  };

  const handleClosePreviewImage = () => {
    setSelectedFile(null);
    if (fPicker.current) {
      fPicker.current.value = "";
    }
  };

  const sendPost = async () => {
    setLoading(true);

    const docRef = await addDoc(collection(db, FIREBASE_DB_NAME.FREEBOARD), {
      creatorId: userInfo.uid,
      creatorName: userInfo.name,
      creatorImage: userInfo.image,
      email: userInfo.email,
      title: title,
      content: content,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (selectedFile) {
      const imageRef = ref(
        storage,
        `${FIREBASE_DB_NAME.FREEBOARD}/${docRef.id}/${filename}`
      );

      await uploadString(imageRef, selectedFile, "data_url");
      const downloadURL = await getDownloadURL(imageRef);

      await updateDoc(docRef, {
        imageUrl: downloadURL,
        filename: filename,
      });
    }

    setLoading(false);
    setTitle("");
    setContent("");
    handleClosePreviewImage();
  };

  return (
    <>
      {userInfo ? (
        <div className="px-4 py-6 bg-white rounded-md shadow-md ">
          <div className="flex gap-4 border-b border-gray-300 pb-2">
            {userInfo.image ? (
              <img
                src={userInfo.image}
                alt="userImage"
                className="w-8 h-8 rounded-full object-cover mr-2"
              />
            ) : (
              <FaUserCircle className="text-gray-600 w-8 h-8 mr-2" />
            )}
            <div className="flex flex-col w-full gap-4">
              <input
                className="p-2 outline-none h-10 border-b border-gray-300 w-full placeholder:text-gray-300"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 적어주세요"
              />
              <textarea
                className="p-2 w-full h-fit border-transparent  outline-none placeholder:text-gray-300"
                onChange={(e) => setContent(e.target.value)}
                value={content}
                placeholder="내용을 적어주세요"></textarea>
            </div>
          </div>
          {selectedFile && (
            <div className="relative">
              <img src={selectedFile} alt="pic" />
              <div
                className="bg-gray-300 text-gray-500 absolute top-0 right-0 m-[10px] text-[18px] h-[30px] w-[30px] rounded-full cursor-pointer grid place-items-center"
                onClick={handleClosePreviewImage}>
                <MdOutlineClose />
              </div>
            </div>
          )}
          <div className="flex flex-col gap-4 items-center px-4 pt-4 md:flex-row justify-between">
            <label htmlFor="filePicker">
              <div className="flex items-center gap-2 cursor-pointer">
                <MdOutlinePhotoLibrary className="text-green-600 text-[30px]" />
                <p className="text-gray-500 font-medium">Photo/video</p>
              </div>

              <input
                type="file"
                name="filePicker"
                id="filePicker"
                accept="image/x-png,image/gif,image/jpeg"
                onChange={addImageToPost}
                ref={fPicker}
                hidden
              />
            </label>
            {!loading ? (
              <button
                onClick={sendPost}
                className="w-[100px] px-4 py-2 text-base text-white uppercase transition-all duration-150 l bg-gradient-to-r from-blue-500 to-indigo-500 rounded-md shadow-md outline-none hover:text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:border-blue-500">
                Post
              </button>
            ) : (
              <span className="flex justify-center">
                <BeatLoader color="rgb(99 102 241)" size={20} />
              </span>
            )}
          </div>
        </div>
      ) : (
        <p>Please login to write a post</p>
      )}
    </>
  );
};

export default PostFreeBoard;
