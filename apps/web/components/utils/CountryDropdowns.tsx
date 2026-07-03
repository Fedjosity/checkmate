import React, { forwardRef } from "react";

import COUNTRIES_DATA from "@/lib/constants/countries.json";

export const COUNTRIES = COUNTRIES_DATA.sort((a, b) => a.name.localeCompare(b.name));

export const PhoneCodeSelect = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  (props, ref) => {
    // Extract unique codes for the phone code dropdown
    const uniqueCodes = Array.from(new Set(COUNTRIES.map(c => c.code)))
      .sort((a, b) => {
        const numA = parseInt(a.replace('+', ''));
        const numB = parseInt(b.replace('+', ''));
        return numA - numB;
      });

    return (
      <select
        ref={ref}
        {...props}
        className={`w-full bg-surface border border-border px-4 py-3 text-text-primary rounded-sm focus:outline-none focus:border-primary transition-colors appearance-none ${props.className || ''}`}
      >
        {uniqueCodes.map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
    );
  }
);
PhoneCodeSelect.displayName = "PhoneCodeSelect";

export const CountrySelect = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  (props, ref) => {
    return (
      <select
        ref={ref}
        {...props}
        className={`w-full bg-surface border border-border px-4 py-3 text-text-primary rounded-sm focus:outline-none focus:border-primary transition-colors appearance-none ${props.className || ''}`}
      >
        {COUNTRIES.map((country) => (
          <option key={country.iso} value={country.name}>
            {country.name}
          </option>
        ))}
      </select>
    );
  }
);
CountrySelect.displayName = "CountrySelect";
