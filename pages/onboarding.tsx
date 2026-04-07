import { useRouter } from "next/router";
import { AppShell } from "@/components/app-shell";
import { CountryPicker } from "@/components/country-picker";
import { useCountry } from "@/components/country-provider";
import { MaterialIcon } from "@/components/material-icon";

export default function OnboardingPage() {
  const router = useRouter();
  const { country, setCountry } = useCountry();

  return (
    <AppShell active="onboarding">
      <div className="editorial-canvas min-h-[70vh] rounded-[32px] px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-headline text-5xl font-extrabold tracking-tight text-primary">Choose your perspective</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-on-surface-variant">
            Select a country to personalize the feed with relevant politicians, celebrities, founders, and public figures.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-5xl">
          <CountryPicker selectedCountry={country} onSelect={setCountry} />
        </div>

        <div className="mx-auto mt-16 max-w-sm">
          <button
            type="button"
            onClick={() => void router.push("/")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-editorial-gradient px-5 py-5 font-headline text-lg font-bold text-white shadow-editorial"
          >
            Get Started
            <MaterialIcon name="arrow_forward" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}
