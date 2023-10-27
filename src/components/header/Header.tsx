import { useEffect, useRef, useState } from "react";
import { getAuth, signOut } from "firebase/auth";
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
import { removeUserInfo } from "@/store/calgarySlice";

const Header = () => {
  const auth = getAuth(firebaseApp);
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state: StateProps) => state.calgary);
  const ref = useRef<HTMLDivElement>(null);
  const [sidebar, setSidebar] = useState(false);

  useEffect(() => {
    document.body.addEventListener("click", (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.contains(ref.current)) {
        setSidebar(false);
      }
    });
  }, []);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        console.log("Signout Successfully");
        dispatch(removeUserInfo());
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <>
      <header className="w-full text-gray-700 bg-white shadow-sm body-font mb-6 sticky top-0 z-50">
        <div className="mx-auto h-30 max-w-full md:max-w-8xl">
          <div className="h-30 flex flex-row items-center p-6 mx-auto">
            <div
              onClick={() => setSidebar(true)}
              className="md:hidden cursor-pointer">
              <AiOutlineMenu className="h-6 w-8" />
            </div>
            <Link
              href="/"
              className="hidden md:flex font-medium text-gray-900 title-font">
              MakeCalgaryTalk
            </Link>
            <div className=" text-gray-600 h-full pl-6 border-gray-200 ml-auto">
              {userInfo ? (
                <div className="flex items-center justify-center ">
                  <MdAccountCircle className="h-6 w-6 mr-1" />{" "}
                  <span className="mr-3 pr-10 border-r border-gray-200">
                    {userInfo.name}
                  </span>
                  <span
                    onClick={handleLogout}
                    className="border border-transparent hover:text-red-400 cursor-pointer duration-300 ">
                    Logout
                  </span>
                </div>
              ) : (
                <>
                  <Link href={"/signin"}>
                    <span className="mr-5 hover:text-gray-900">로그인</span>
                  </Link>
                  <Link
                    href={"/signup"}
                    className="px-4 py-2 text-base text-white uppercase transition-all duration-150 bg-teal-500 rounded shadow outline-none active:bg-teal-600 hover:shadow-md focus:outline-none ease">
                    회원가입
                  </Link>
                </>
              )}
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
