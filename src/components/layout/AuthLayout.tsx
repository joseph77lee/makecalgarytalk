import { ReactElement } from "react";
import styles from "@/styles/AuthLayout.module.css";

interface Props {
  children: ReactElement;
}
const AuthLayout = ({ children }: Props) => {
  return (
    <div className="flex mx-auto h-[892px] max-w-full md:max-w-7xl p-6">
      <div className="mx-auto shadow-md rounded-xl bg-white w-full grid md:grid-cols-2">
        <div className={styles.imgStyle}>
          <div className={styles.cartoonImg}></div>
          <div className={styles.cloud_one}></div>
          <div className={styles.cloud_two}></div>
        </div>
        <div className="right flex flex-col justify-evenly">
          <div className="text-center">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
