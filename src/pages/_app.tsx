import RootLayout from "@/components/layout/RootLayout";
import { persistor, store } from "@/store/store";
import { Provider } from "react-redux";
import { SessionProvider } from "next-auth/react";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { PersistGate } from "redux-persist/integration/react";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor} loading={null}>
        <div className="font-bodyFont min-h-screen bg-gray-100 min-w-screen">
          <SessionProvider session={session}>
            <RootLayout>
              <Component {...pageProps} />
            </RootLayout>
          </SessionProvider>
        </div>
      </PersistGate>
    </Provider>
  );
}
