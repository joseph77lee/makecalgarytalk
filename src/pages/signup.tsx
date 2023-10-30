import Link from "next/link";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { useState } from "react";
import { HiAtSymbol, HiFingerPrint, HiOutlineUser } from "react-icons/hi";
import { BeatLoader } from "react-spinners";
import { firebaseApp } from "@/firebase/firebase.config";
import { useRouter } from "next/router";
import AuthLayout from "@/components/layout/AuthLayout";
import styles from "@/styles/Form.module.css";
import { useFormik } from "formik";
import { signUpValidate } from "@/lib/validate";

const HandleSignup = () => {
  const router = useRouter();
  const auth = getAuth(firebaseApp);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState({ password: false, cpassword: false });

  const formik = useFormik({
    initialValues: {
      nickname: "",
      email: "",
      password: "",
      cpassword: "",
    },
    validate: signUpValidate,
    onSubmit: async (values, { setStatus, validateField }) => {
      setLoading(true);
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        await updateProfile(userCredential.user, {
          displayName: values.nickname,
        });
        setLoading(false);
        router.push("/");
      } catch (error: any) {
        const errorCode = error.code;
        if (errorCode.includes("auth/email-already-in-use")) {
          setStatus({
            error: { emailUsed: "Email already in use, Try another one." },
          });
        }
        console.log(errorCode);
        setLoading(false);
      }
    },
  });

  return (
    <AuthLayout>
      <section className="w-3/4 mx-auto flex flex-col gap-10">
        <div className="title">
          <h1 className="text-gray-700 text-4xl font-bold py-4">회원가입</h1>
          <p className="w-3/4 mx-auto text-gray-300">
            Create your account for full access
          </p>
        </div>
        {/* form */}
        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-5">
          <div
            className={`${styles.inputGroup} ${
              formik.errors.nickname && formik.touched.nickname
                ? "border-rose-600"
                : ""
            }`}>
            <input
              type="text"
              placeholder="Nickname"
              className={styles.inputText}
              {...formik.getFieldProps("nickname")}
            />
            <span className="icon flex items-center px-4 bg-slate-50 rounded-tr-xl rounded-br-xl">
              <HiOutlineUser size={25} />
            </span>
          </div>
          {formik.errors.nickname && formik.touched.nickname ? (
            <span className="text-red-600 text-xs font-semibold tracking-wide flex items-center justify-center">
              {formik.errors.nickname}
            </span>
          ) : (
            <></>
          )}
          <div
            className={`${styles.inputGroup} ${
              (formik.errors.email && formik.touched.email) ||
              (formik.status && formik.status.error.emailUsed)
                ? "border-rose-600"
                : ""
            }`}>
            <input
              type="email"
              placeholder="Email"
              className={styles.inputText}
              {...formik.getFieldProps("email")}
            />
            <span className="icon flex items-center px-4 bg-slate-50 rounded-tr-xl rounded-br-xl">
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
          {formik.status && formik.status.error.emailUsed ? (
            <span className="text-red-600 text-xs font-semibold tracking-wide flex items-center justify-center">
              {formik.status.error.emailUsed}
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
              type={`${show.password ? "text" : "password"}`}
              placeholder="Password"
              className={styles.inputText}
              {...formik.getFieldProps("password")}
            />
            <span
              onClick={() => setShow({ ...show, password: !show.password })}
              className="icon flex items-center px-4 bg-slate-50 rounded-tr-xl rounded-br-xl">
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
          <div
            className={`${styles.inputGroup} ${
              formik.errors.cpassword && formik.touched.cpassword
                ? "border-rose-600"
                : ""
            }`}>
            <input
              type={`${show.cpassword ? "text" : "password"}`}
              placeholder="Confirm password"
              className={styles.inputText}
              {...formik.getFieldProps("cpassword")}
            />
            <span
              onClick={() => setShow({ ...show, cpassword: !show.cpassword })}
              className="icon flex items-center px-4 bg-slate-50 rounded-tr-xl rounded-br-xl">
              <HiFingerPrint size={25} />
            </span>
          </div>
          {formik.errors.cpassword && formik.touched.cpassword ? (
            <span className="text-red-600 text-xs font-semibold tracking-wide flex items-center justify-center">
              {formik.errors.cpassword}
            </span>
          ) : (
            <></>
          )}
          {/* login button */}
          <div className="input-button">
            {!loading ? (
              <button
                type="submit"
                className={`${styles.button} disabled=${loading}`}>
                <span className="mr-2 uppercase">Sign Up</span>
              </button>
            ) : (
              <span className="flex justify-center">
                <BeatLoader color="rgb(99 102 241)" size={20} />
              </span>
            )}
          </div>
        </form>
        <p className="text-center">
          {" 계정이 있으신가요? "}
          <Link href="signin">
            <span className="text-blue-700">로그인</span>
          </Link>
        </p>
        {/* bottom */}
        <p className="text-xs leading-4">
          By Continuing, you agree to MakeCalgaryTalk{"'"}s{" "}
          <span className="text-blue-700">Condition of Use</span> and{" "}
          <span className="text-blue-700">Privacy Notice.</span>
        </p>
      </section>
    </AuthLayout>
  );
};

export default HandleSignup;
