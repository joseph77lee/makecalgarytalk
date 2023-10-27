import { IoHome } from "react-icons/io5";
import { CgFeed } from "react-icons/cg";

const MainMenu = () => {
  return (
    <>
      <p className="flex items-center px-3 py-2 text-gray-600 transition-colors duration-300 transform rounded-md hover:bg-gray-200 hover:text-gray-700 cursor-pointer">
        <span className="flex w-5 h-5 items-center">
          <IoHome />
        </span>
        <span className="mx-2">홈</span>
      </p>
      <p className="flex items-center px-3 py-2 text-gray-600 transition-colors duration-300 transform rounded-md hover:bg-gray-200 hover:text-gray-700 cursor-pointer">
        <span className="flex w-5 h-5 items-center">
          <CgFeed />
        </span>
        <span className="mx-2">자유게시판</span>
      </p>
    </>
  );
};

export default MainMenu;
