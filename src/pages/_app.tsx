import RootLayout from "@/components/RootLayout";
import { store } from "@/store/store";
import { Provider } from "react-redux";
import "@/styles/globals.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <div className="font-bodyFont min-h-screen bg-gray-100 min-w-screen">
        <RootLayout>
          <Component {...pageProps} />
        </RootLayout>
      </div>
    </Provider>
  );
}
