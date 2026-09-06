"use client";

import { useState } from "react";
import { MapPin, Loader2, Check } from "lucide-react";

type CountryOption = {
  code: string;
  name: string;
  flag: string;
  continent: string;
};

type Props = {
  initialCode?: string | null;
  countries: CountryOption[];
  inputClass: string;
};

export function CountrySelectWithDetect({ initialCode, countries, inputClass }: Props) {
  const [selectedCode, setSelectedCode] = useState(initialCode || "");
  const [detecting, setDetecting] = useState(false);
  const [detectMsg, setDetectMsg] = useState<string | null>(null);

  async function handleAutoDetect() {
    setDetecting(true);
    setDetectMsg(null);
    try {
      const res = await fetch("/api/geolocation/detect");
      const data = await res.json();
      if (data.success && data.countryCode) {
        setSelectedCode(data.countryCode);
        setDetectMsg(`Detected: ${data.flag} ${data.countryName} (${data.countryCode})`);
      } else {
        setDetectMsg("Could not detect location from IP headers.");
      }
    } catch {
      setDetectMsg("Detection failed. Please select your nation manually.");
    } finally {
      setDetecting(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
          Represented Country
        </label>
        <button
          type="button"
          onClick={handleAutoDetect}
          disabled={detecting}
          className="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 transition"
        >
          {detecting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <MapPin className="h-3 w-3" />
          )}
          {detecting ? "Detecting IP..." : "Auto-Detect from IP"}
        </button>
      </div>

      <select
        name="countryCode"
        value={selectedCode}
        onChange={(e) => {
          setSelectedCode(e.target.value);
          setDetectMsg(null);
        }}
        className={inputClass}
      >
        <option value="">🌐 None / Hidden</option>
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.name} ({c.continent})
          </option>
        ))}
      </select>

      {detectMsg && (
        <p className="flex items-center gap-1 text-[11px] font-medium text-emerald-500 dark:text-emerald-400">
          <Check className="h-3 w-3" />
          {detectMsg}
        </p>
      )}
    </div>
  );
}
