import { MouseEvent, useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { motion } from "framer-motion";
import { MdEmail } from "react-icons/md";
import { RiLockPasswordFill } from "react-icons/ri";
import { BeatLoader } from "react-spinners";
import { firebaseApp } from "@/firebase/firebase.config";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { setUserInfo } from "@/store/calgarySlice";

const HandleSignin = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const auth = getAuth(firebaseApp);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errEmail, setErrEmail] = useState("");
  const [errPassword, setErrPassword] = useState("");
  const [errFirebase, setErrFirebase] = useState("");

  // Loading state start
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setErrEmail("");
  };

  const handlePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setErrPassword("");
  };

  const handleSignin = (e: MouseEvent) => {
    e.preventDefault();

    if (!email) {
      setErrEmail("Enter your email");
    }

    if (!password) {
      setErrPassword("Enter your password");
    }

    if (email && password) {
      setLoading(true);
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          console.log(user);
          setLoading(false);

          if (!user.emailVerified) {
            setErrFirebase(
              "Please confirm the verification link in your email."
            );
          } else {
            dispatch(
              setUserInfo({
                _id: user.uid,
                name: user.displayName,
                email: user.email,
                image: user.photoURL,
              })
            );
            // TODO : After signin redirect to sucess page
            router.push("/");
          }
        })
        .catch((error) => {
          setLoading(false);
          setErrFirebase(
            "Neither the email nor the password is incorrect. Please try with the correct credentials."
          );
        });
      setEmail("");
      setPassword("");
    }
  };

  return (
    <div className="w-full">
      <div className="w-full pb-10">
        <div className="w-[370px] bg-white mx-auto items-center flex flex-col shadow-md rounded-xl px-4 sm:px-6 md:px-8 lg:px-10 py-8 max-w-md">
          <div className="font-medium self-center text-xl sm:text-3xl text-gray-700">
            로그인
          </div>
          <div className="mt-4 self-center text-xl sm:text-sm text-gray-800">
            Enter your credentials to get access account
          </div>
          <div className="mt-5 w-full">
            <form>
              <div className="flex flex-col mb-5">
                <label
                  htmlFor="email"
                  className="mb-1 text-sm tracking-wide text-gray-700">
                  이메일:
                </label>
                <div className="relative">
                  <span className="inline-flex items-center justify-center absolute left-0 top-0 h-full w-10">
                    <MdEmail className="text-teal-500" />
                  </span>
                  <input
                    onChange={handleEmail}
                    value={email}
                    className="text-sm placeholder-gray-500 pl-10 pr-4 rounded-md border order-gray-400 w-full py-2 focus:outline-none focus:border-teal-400"
                    placeholder="Enter your email"
                  />
                </div>
                {errEmail && (
                  <p className="text-red-600 text-xs font-semibold tracking-wide flex items-center gap-2 ml-1">
                    <span className="italic text-base font-extrabold">!</span>{" "}
                    {errEmail}
                  </p>
                )}
              </div>
              <div className="flex flex-col mb-5">
                <label
                  htmlFor="password"
                  className="mb-1 text-sm tracking-wide text-gray-700">
                  비밀번호:
                </label>
                <div className="relative">
                  <span className="inline-flex items-center justify-center absolute left-0 top-0 h-full w-10">
                    <RiLockPasswordFill className="text-teal-500" />
                  </span>
                  <input
                    onChange={handlePassword}
                    value={password}
                    type="password"
                    className="text-sm placeholder-gray-500 pl-10 pr-4 rounded-md border  order-gray-400 w-full py-2 focus:outline-none focus:border-teal-400"
                    placeholder="Enter your password"
                  />
                </div>
                {errPassword && (
                  <p className="text-red-600 text-xs font-semibold tracking-wide flex items-center gap-2 ml-1">
                    <span className="italic text-base font-extrabold">!</span>{" "}
                    {errPassword}
                  </p>
                )}
              </div>
              <button
                onClick={handleSignin}
                type="submit"
                className="flex mt-2 items-center justify-center focus:outline-none text-white text-sm sm:text-base bg-teal-500 hover:bg-teal-600 rounded-md py-2 w-full transition duration-150 ease-in"
                disabled={loading}>
                {!loading && <span className="mr-2 uppercase">Login</span>}
                {loading && (
                  <span className="flex justify-center">
                    <BeatLoader color="#ffffff" size={20} />
                  </span>
                )}
                <span>{/* 아이콘 넣기 */}</span>
              </button>
              {errFirebase && (
                <p className="text-red-600 text-xs font-semibold tracking-wide flex items-center gap-2 ml-1 mt-5">
                  <span className="italic text-base font-extrabold">!</span>{" "}
                  {errFirebase}
                </p>
              )}
              {successMsg && (
                <div>
                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-base mt-5 font-titleFont font-semibold text-teal-500 border-[1px] border-teal-600 px-2 text-center">
                    {successMsg}
                  </motion.p>
                </div>
              )}
            </form>
            <p className="text-xs text-black leading-4 mt-4">
              By Continuing, you agree to MakeCalgaryTalk{"'"}s{" "}
              <span className="text-teal-600">Condition of Use</span> and{" "}
              <span className="text-teal-600">Privacy Notice.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandleSignin;
