import "@src/styles/globals.css";
import "@src/styles/nprogress.css";
import React, { useEffect, useState } from "react";
import { trpc } from "@src/utils/trpc";
import { ThemeProvider } from "next-themes";
import Script from "next/script";
import type { AppProps } from "next/app";
import { Poppins } from "next/font/google";
import clsx from "clsx";
import NProgress from "nprogress";
import { Header, Footer } from "@src/components/layout";
import LoadingAnimation from "@src/components/loading-animation";

NProgress.configure({ showSpinner: false });

const montserrat = Poppins({
  style: ["normal", "italic"],
  weight: ["200", "400", "600", "800"],
  subsets: ["latin"],
  variable: "--font-open_sans",
});

const App = ({ Component, router, pageProps }: AppProps) => {
  const [loadingAnimationIsVisibile, setLoadingAnimationIsVisible] =
    useState(false);
  useEffect(() => {
    router.events.on("routeChangeStart", () => {
      NProgress.start();
      setLoadingAnimationIsVisible(true);
    });
    router.events.on("routeChangeComplete", () => {
      NProgress.done();
      setLoadingAnimationIsVisible(false);
    });
    router.events.on("routeChangeError", () => {
      NProgress.done();
      setLoadingAnimationIsVisible(false);
    });
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <div
        className={clsx(
          "flex flex-col justify-between w-full scroll-smooth overflow-hidden",
          montserrat.className,
          {
            "dark:bg-coal": router.pathname !== "/",
          }
        )}
      >
        <Header />
        <LoadingAnimation visible={loadingAnimationIsVisibile} />
        <div className="mt-[3rem] min-h-[calc(100vh-3rem)] w-full">
          <Component {...pageProps} />
        </div>
        <Footer />
      </div>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-8VSXZQ5WH9"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive" defer>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-8VSXZQ5WH9');
        `}
      </Script>
    </ThemeProvider>
  );
};

export default trpc.withTRPC(App);
