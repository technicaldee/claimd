"use client";

import { createContext, useContext, useMemo, useState } from "react";

const STORAGE_KEY = "claimd:selected-country";

interface CountryContextValue {
  country: string;
  setCountry: (country: string) => void;
}

const CountryContext = createContext<CountryContextValue | undefined>(undefined);

export function CountryProvider({
  children,
  initialCountry = "Global"
}: {
  children: React.ReactNode;
  initialCountry?: string;
}) {
  const [country, setCountryState] = useState(() => {
    if (typeof window === "undefined") {
      return initialCountry;
    }

    return window.localStorage.getItem(STORAGE_KEY) || initialCountry;
  });

  const value = useMemo(
    () => ({
      country,
      setCountry: (nextCountry: string) => {
        window.localStorage.setItem(STORAGE_KEY, nextCountry);
        setCountryState(nextCountry);
      }
    }),
    [country]
  );

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
}

export function useCountry() {
  const context = useContext(CountryContext);
  if (!context) {
    throw new Error("useCountry must be used within CountryProvider");
  }

  return context;
}
