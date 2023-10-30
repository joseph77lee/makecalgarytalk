/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { firebaseApp } from "@/firebase/firebase.config";
import { motion, AnimatePresence } from "framer-motion";
import { IoCloseSharp } from "react-icons/io5";
import { AiOutlineMenu } from "react-icons/ai";
import { MdAccountCircle } from "react-icons/md";
import { FiLogOut } from "react-icons/fi";
import MainMenu from "../MainMenu";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { StateProps } from "../../../type";
import { addtUserInfo, removeUserInfo } from "@/store/calgarySlice";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

const Header = () => {
  const { data: session } = useSession();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state: StateProps) => state.calgary);
  const ref = useRef<HTMLDivElement>(null);
  const [sidebar, setSidebar] = useState(false);

  useEffect(() => {
    console.log("Client session---->", session);
    if (session) {
      dispatch(
        addtUserInfo({
          name: session?.user?.name,
          email: session?.user?.email,
          image: session?.user?.image,
          emailVerified: session?.user?.emailVerified,
        })
      );
    }

    document.body.addEventListener("click", (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.contains(ref.current)) {
        setSidebar(false);
      }
    });
  }, [dispatch, session]);

  const handleSignin = () => {
    signIn();
  };

  const handleLogout = async () => {
    signOut();
    dispatch(removeUserInfo());
  };

  return (
    <>
      <header className="w-full text-gray-700 bg-white shadow-sm body-font mb-6 sticky top-0 z-50">
        <div className="mx-auto max-w-full md:max-w-7xl">
          <div className="flex items-center justify-between p-6">
            <div
              onClick={() => setSidebar(true)}
              className="md:hidden cursor-pointer">
              <AiOutlineMenu className="h-6 w-8" />
            </div>
            <Link
              href="/"
              className="hidden md:flex font-medium text-gray-600 title-font">
              MakeCalgaryTalk
            </Link>
            <div className="h-10 flex items-center">
              <div className="text-gray-600 pl-6 border-gray-200 ml-auto">
                {userInfo ? (
                  <div className="flex items-center">
                    <img
                      src={userInfo.image}
                      alt="userImage"
                      className="w-8 h-8 rounded-full object-cover mr-2"
                    />
                    <p className="mr-3 pr-3 border-r border-gray-200">
                      {userInfo.name}
                    </p>
                    <p
                      onClick={handleLogout}
                      className="border border-transparent hover:text-red-400 cursor-pointer duration-300 ">
                      Logout
                    </p>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleSignin}
                      className="px-4 py-2 text-base text-white uppercase transition-all duration-150 bg-teal-500 rounded shadow outline-none active:bg-teal-600 hover:shadow-md focus:outline-none ease">
                      로그인
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <AnimatePresence>
          {sidebar && (
            <div className="w-full h-screen text-gray-600 fixed top-0 left-0 bg-gray-900 bg-opacity-50">
              <div className="w-full h-full relative">
                <motion.div
                  ref={ref}
                  initial={{ x: -500, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  exit={{ x: -500, opacity: 0 }}
                  className="w-[60%] md:w-[350px] h-full bg-white border border-teal-700">
                  <div
                    onClick={() => setSidebar(false)}
                    className="w-full h-10 bg-teal-500 text-white py-2 px-6 flex items-center gap-4 cursor-pointer">
                    <IoCloseSharp />
                  </div>
                  <MainMenu />
                </motion.div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
};

export default Header;
