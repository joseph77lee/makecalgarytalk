import { useState } from "react";
import { BeatLoader } from "react-spinners";
import { HiAtSymbol, HiFingerPrint } from "react-icons/hi";
import { useRouter } from "next/router";
import AuthLayout from "@/components/layout/AuthLayout";
import Link from "next/link";
import styles from "@/styles/Form.module.css";
import Image from "next/image";
import { SignInResponse, signIn } from "next-auth/react";
import { useFormik } from "formik";
import { signInValidate } from "@/lib/validate";

const HandleSignin = () => {
  const router = useRouter();

  // Loading state start
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  // Formik hook
  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validate: signInValidate,
    onSubmit: async (values, { setStatus }) => {
      setLoading(true);
      try {
        const status: SignInResponse | undefined = await signIn("credentials", {
          redirect: false,
          email: values.email,
          password: values.password,
        });

        setLoading(false);
        console.log(status);
        if (status?.error) {
          console.log(status.error);
          setStatus({
            error: { signInError: status.error },
          });
        } else {
          router.push("/");
        }
      } catch (error) {
        setLoading(false);
        console.log("client signIn error");
      }
    },
  });

  const handleSignin = async (signinProvider: string) => {
    try {
      await signIn(signinProvider, { callbackUrl: "http://localhost:3000" });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <AuthLayout>
      <section className="w-3/4 mx-auto flex flex-col gap-10">
        <div className="title">
          <h1 className="text-gray-700 text-4xl font-bold py-4">로그인</h1>
          <p className="w-3/4 mx-auto text-gray-300">
            Enter your credentials to get access account
          </p>
        </div>
        {/* form */}
        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-5">
          <div
            className={`${styles.inputGroup} ${
              formik.errors.email && formik.touched.email
                ? "border-rose-600"
                : ""
            }`}>
            <input
              type="email"
              placeholder="Email"
              className={styles.inputText}
              {...formik.getFieldProps("email")}
            />
            <span className="icon flex items-center px-4 bg-slate-50 rounded-tr-xl rounded-br-xl ">
              <HiAtSymbol size={25} />
            </span>
          </div>
          {formik.errors.email && formik.touched.email ? (
            <span className="text-red-600 text-xs font-semibold tracking-wide flex items-center justify-center">
              {formik.errors.email}
            </span>
          ) : (
            <></>
          )}
          <div
            className={`${styles.inputGroup} ${
              formik.errors.password && formik.touched.password
                ? "border-rose-600"
                : ""
            }`}>
            <input
              type={`${show ? "text" : "password"}`}
              placeholder="Password"
              className={styles.inputText}
              {...formik.getFieldProps("password")}
            />
            <span
              onClick={() => setShow(!show)}
              className="icon flex items-center px-4 bg-slate-50 rounded-tr-xl rounded-br-xl ">
              <HiFingerPrint size={25} />
            </span>
          </div>
          {formik.errors.password && formik.touched.password ? (
            <span className="text-red-600 text-xs font-semibold tracking-wide flex items-center justify-center">
              {formik.errors.password}
            </span>
          ) : (
            <></>
          )}
          {formik.status && formik.status.error.signInError ? (
            <span className="text-red-600 text-xs font-semibold tracking-wide flex items-center justify-center">
              {formik.status.error.signInError}
            </span>
          ) : (
            <></>
          )}
          {/* login button */}
          <div className="input-button mb-5">
            {!loading ? (
              <button
                type="submit"
                className={`${styles.button} disabled=${loading}`}>
                Login
              </button>
            ) : (
              <span className="flex justify-center">
                <BeatLoader color="rgb(99 102 241)" size={20} />
              </span>
            )}
          </div>
          <p className="w-full text-sm text-gray-600 mb-5 flex items-center">
            <span className="w-1/3 h-[1px] bg-zinc-400 inline-flex"></span>
            <span className="w-1/3 text-center font-semibold">간편 로그인</span>
            <span className="w-1/3 h-[1px] bg-zinc-400 inline-flex"></span>
          </p>
          <div className="flex items-center justify-center">
            <Image
              src={"/assets/btn_kakao.svg"}
              width={25}
              height={25}
              className="mr-3 cursor-pointer"
              alt="kakao"
              onClick={() => handleSignin("kakao")}
            />
            <Image
              src={"/assets/btn_google.svg"}
              width={25}
              height={25}
              className="mr-3 cursor-pointer"
              alt="google"
              onClick={() => handleSignin("google")}
            />
            <Image
              src={"/assets/btn_naver.svg"}
              width={25}
              height={25}
              className="mr-3 cursor-pointer"
              alt="naver"
              onClick={() => handleSignin("naver")}
            />
            <Image
              src={"/assets/github.svg"}
              width={25}
              height={25}
              className="mr-3 cursor-pointer"
              alt="github"
              onClick={() => handleSignin("github")}
            />
          </div>
        </form>
        <p className="text-center">
          {" 아직 계정이 없으신가요? "}
          <Link href="signup">
            <span className="text-blue-700">회원가입</span>
          </Link>
        </p>
        {/* bottom */}
        <p className="text-xs leading-4">
          By Continuing, you agree to MakeCalgaryTalk{"'"}s{" "}
          <span className="text-blue-700">Condition of Use</span> and{" "}
          <span className="text-blue-700">Privacy Notice.</span>
        </p>
        {loading && (
          <span className="flex justify-center">
            <BeatLoader color="#ffffff" size={20} />
          </span>
        )}
      </section>
    </AuthLayout>
  );
};

export default HandleSignin;
