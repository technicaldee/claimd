import type { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";
import localFont from "next/font/local";
import { CountryProvider } from "@/components/country-provider";
import { WalletProvider } from "@/components/wallet-provider";
import "@/styles/globals.css";

const averta = localFont({
  src: [
    {
      path: "../public/fonts/averta/Averta-Regular.woff2",
      weight: "400",
      style: "normal"
    },
    {
      path: "../public/fonts/averta/Averta-Bold.woff2",
      weight: "700",
      style: "normal"
    }
  ],
  variable: "--font-averta"
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-H2EQ6E8LXN"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-H2EQ6E8LXN');
        `}
      </Script>
      <Head>
        <title>Claimd</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#000b60" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="description"
          content="Claimd is a MiniPay-native public figure feed where people post sourced claims and earn when others pay to like or dislike them."
        />
        <meta property="og:title" content="Claimd" />
        <meta property="og:description" content="Post claims. Back reactions. Earn from attention." />
        <meta property="og:image" content="/logo.png" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:image" content="/logo.png" />
      </Head>
      <div className={averta.variable}>
        <CountryProvider>
          <WalletProvider>
            <Component {...pageProps} />
          </WalletProvider>
        </CountryProvider>
      </div>
    </>
  );
}
