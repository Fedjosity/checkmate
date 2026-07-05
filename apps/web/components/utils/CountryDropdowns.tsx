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

export interface CountrySelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  allowedISOs?: string[];
}

export const CountrySelect = forwardRef<HTMLSelectElement, CountrySelectProps>(
  (props, ref) => {
    const { allowedISOs, className, ...rest } = props;
    
    const countriesToRender = allowedISOs 
      ? COUNTRIES.filter((c) => allowedISOs.includes(c.iso)) 
      : COUNTRIES;

    return (
      <select
        ref={ref}
        {...rest}
        className={`w-full h-10 bg-surface border border-border px-3 py-2 text-sm text-white rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary focus:bg-primary/5 focus:shadow-[0_0_15px_rgba(230,195,100,0.15)] transition-all duration-300 appearance-none ${className || ''}`}
      >
        <option value="" disabled className="bg-surface text-muted">
          Select your country
        </option>
        {countriesToRender.map((country) => (
          <option key={country.iso} value={country.name} className="bg-surface text-white">
            {country.name}
          </option>
        ))}
      </select>
    );
  }
);
CountrySelect.displayName = "CountrySelect";
