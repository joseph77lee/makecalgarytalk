import Link from "next/link";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { MouseEvent, useState } from "react";
import { motion } from "framer-motion";
import { BiSolidUser } from "react-icons/bi";
import { MdEmail } from "react-icons/md";
import { RiLockPasswordFill } from "react-icons/ri";
import { BeatLoader } from "react-spinners";
import { firebaseApp } from "@/firebase/firebase.config";
import { useRouter } from "next/router";

const HandleSignup = () => {
  const router = useRouter();
  const auth = getAuth(firebaseApp);
  const [userName, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cPassword, setCPassword] = useState("");

  // Error message start
  const [errUserName, setErrUsername] = useState("");
  const [errEmail, setErrEmail] = useState("");
  const [errPassword, setErrPassword] = useState("");
  const [errCPassword, setErrCPassword] = useState("");
  const [errFirebase, setErrFirebase] = useState("");

  // Loading state start
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Handle function start
  const handleUserName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    setErrUsername("");
  };

  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setErrEmail("");
  };

  const handlePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setErrPassword("");
  };

  const handleCPassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCPassword(e.target.value);
    setErrCPassword("");
  };

  // Email Validation start
  const emailValidation = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
      );
  };

  // Submit button start
  const handleRegistration = (e: MouseEvent) => {
    e.preventDefault();
    if (!userName) {
      setErrUsername("Enter your name");
    }
    if (!email) {
      setErrEmail("Enter your email");
      setErrFirebase("");
    } else {
      if (!emailValidation(email)) {
        setErrEmail("Enter a valid email");
      }
    }
    if (!password) {
      setErrPassword("Enter your password");
    } else {
      if (password.length < 6) {
        setErrPassword("Passwords must be at least 6 charactoers");
      }
    }
    if (!cPassword) {
      setErrCPassword("Confirm your password");
    } else {
      if (cPassword !== password) {
        setErrCPassword("Password not matched");
      }
    }

    if (
      userName &&
      email &&
      emailValidation(email) &&
      password &&
      password.length >= 6 &&
      cPassword &&
      cPassword === password
    ) {
      setLoading(true);
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          updateProfile(userCredential.user, {
            displayName: userName,
          });

          const user = userCredential.user;

          if (user && auth.currentUser) {
            sendEmailVerification(auth.currentUser)
              .then(() => {
                router.push("finishSignup");
              })
              .catch((error) => {
                setErrFirebase("Something went wrong. Please try later.");
              });
          }

          setLoading(false);
          // TODO : After signup redirect to sucess page
        })
        .catch((error) => {
          setLoading(false);
          const errorCode = error.code;
          if (errorCode.includes("auth/email-already-in-use")) {
            setErrFirebase("Email already in use, Try another one.");
          }
        });

      setUsername("");
      setEmail("");
      setPassword("");
      setCPassword("");
      setErrFirebase("");
    }
  };

  return (
    <div className="w-full">
      <div className="w-full pb-10">
        <div className="w-[370px] bg-white mx-auto items-center flex flex-col shadow-md rounded-xl px-4 sm:px-6 md:px-8 lg:px-10 py-8 max-w-md">
          <div className="font-medium self-center text-xl sm:text-3xl text-gray-700">
            회원가입
          </div>
          <div className="mt-4 self-center text-xl sm:text-sm text-gray-800">
            Create your account for full access
          </div>
          <div className="mt-5 w-full">
            <form>
              <div className="flex flex-col mb-5">
                <label
                  htmlFor="userName"
                  className="mb-1 text-sm tracking-wide text-gray-700">
                  이름:
                </label>
                <div className="relative">
                  <span className="inline-flex items-center justify-center absolute left-0 top-0 h-full w-10">
                    <BiSolidUser className="text-teal-500" />
                  </span>
                  <input
                    onChange={handleUserName}
                    value={userName}
                    className="text-sm placeholder-gray-500 pl-10 pr-4 rounded-md border border-gray-400 w-full py-2 focus:outline-none focus:border-teal-400"
                    placeholder="Enter your name"
                  />
                </div>
                {errUserName && (
                  <p className="text-red-600 text-xs font-semibold tracking-wide flex items-center gap-2 ml-1">
                    <span className="italic text-base font-extrabold">!</span>{" "}
                    {errUserName}
                  </p>
                )}
              </div>
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
                    className="text-sm placeholder-gray-500 pl-10 pr-4 rounded-md border border-gray-400 w-full py-2 focus:outline-none focus:border-teal-400"
                    placeholder="Enter your email"
                  />
                </div>
                {errEmail && (
                  <p className="text-red-600 text-xs font-semibold tracking-wide flex items-center gap-2 ml-1">
                    <span className="italic text-base font-extrabold">!</span>{" "}
                    {errEmail}
                  </p>
                )}
                {errFirebase && (
                  <p className="text-red-600 text-xs font-semibold tracking-wide flex items-center gap-2 ml-1">
                    <span className="italic text-base font-extrabold">!</span>{" "}
                    {errFirebase}
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
                    type="password"
                    value={password}
                    onChange={handlePassword}
                    className="text-sm placeholder-gray-500 pl-10 pr-4 rounded-md border border-gray-400 w-full py-2 focus:outline-none focus:border-teal-400"
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
              <div className="flex flex-col mb-5">
                <label
                  htmlFor="confirmPassword"
                  className="mb-1 text-sm tracking-wide text-gray-700">
                  비밀번호 확인:
                </label>
                <div className="relative">
                  <span className="inline-flex items-center justify-center absolute left-0 top-0 h-full w-10">
                    <RiLockPasswordFill className="text-teal-500" />
                  </span>
                  <input
                    type="password"
                    value={cPassword}
                    onChange={handleCPassword}
                    className="text-sm placeholder-gray-500 pl-10 pr-4 rounded-md border border-gray-400 w-full py-2 focus:outline-none focus:border-teal-400"
                    placeholder="Confirm your password"
                  />
                </div>
                {errCPassword && (
                  <p className="text-red-600 text-xs font-semibold tracking-wide flex items-center gap-2 ml-1">
                    <span className="italic text-base font-extrabold">!</span>{" "}
                    {errCPassword}
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-700 mb-5">
                {(!errPassword || !errCPassword) &&
                  "Passwords must be at least 6 characters."}
              </p>
              <button
                onClick={handleRegistration}
                className="flex items-center justify-center focus:outline-none text-white text-sm sm:text-base bg-teal-500 hover:bg-teal-600 rounded-2xl py-2 w-full transition duration-150 ease-in"
                disabled={loading}>
                {!loading && <span className="mr-2 uppercase">Sign Up</span>}
                {loading && (
                  <span className="flex justify-center">
                    <BeatLoader color="#ffffff" size={20} />
                  </span>
                )}
                <span>{/* 아이콘 여기 넣기 */}</span>
              </button>
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
            <p className="text-xs text-gray-700 leading-4 my-4">
              By Continuing, you agree to MakeCalgaryTalk{"'"}s{" "}
              <span className="text-teal-600">Condition of Use</span> and{" "}
              <span className="text-teal-600">Privacy Notice.</span>
            </p>
            <div className="w-full">
              <div className="text-xs text-gray-700">
                Already have an account?{"  "}
                <Link href={"/signin"}>
                  <span className="text-xs text-teal-600 hover:text-orange-600 hover:underline underline-offset-1 cursor-pointer duration-100 w-full">
                    Sign in
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandleSignup;
