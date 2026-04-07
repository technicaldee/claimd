import { COUNTRY_OPTIONS } from "@/lib/constants/countries";
import { cn } from "@/lib/utils";

export function CountryPicker({
  selectedCountry,
  onSelect
}: {
  selectedCountry: string;
  onSelect: (country: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {COUNTRY_OPTIONS.map((country) => (
        <button
          key={country.code}
          type="button"
          onClick={() => onSelect(country.name)}
          className={cn(
            "rounded-xl border p-5 text-left transition active:scale-[0.98]",
            selectedCountry === country.name
              ? "border-primary bg-primary text-white"
              : "border-outline-variant/15 bg-surface-container-lowest hover:border-primary/40"
          )}
        >
          <div className="mb-4 text-2xl">{country.flagEmoji}</div>
          <div className="font-headline text-lg font-bold">{country.name}</div>
          <div className={cn("text-xs uppercase tracking-wider", selectedCountry === country.name ? "text-white/80" : "text-on-secondary-container")}>
            {country.descriptor}
          </div>
        </button>
      ))}
    </div>
  );
}
