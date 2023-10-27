import { ReactElement } from "react";
import Header from "./header/Header";
import MainMenu from "./MainMenu";

interface Props {
  children: ReactElement;
}

const RootLayout = ({ children }: Props) => {
  return (
    <>
      <Header />

      {children}
    </>
  );
};

export default RootLayout;
