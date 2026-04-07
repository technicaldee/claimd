import type { AppProps } from "next/app";
import Head from "next/head";
import { Inter, Manrope } from "next/font/google";
import { CountryProvider } from "@/components/country-provider";
import { WalletProvider } from "@/components/wallet-provider";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope"
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Claimd</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
      <div className={`${inter.variable} ${manrope.variable}`}>
        <CountryProvider>
          <WalletProvider>
            <Component {...pageProps} />
          </WalletProvider>
        </CountryProvider>
      </div>
    </>
  );
}
