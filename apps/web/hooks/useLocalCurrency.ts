import { useState, useEffect } from "react";
import { getExchangeRate } from "@/lib/api/wallet";

const CACHE_KEY_CURRENCY = 'cm_local_currency';
const CACHE_KEY_RATES = 'cm_exchange_rates';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export function useLocalCurrency() {
  const [currency, setCurrency] = useState<string>("USD");
  const [rate, setRate] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCurrencyAndRates() {
      try {
        // 1. Get user's local currency (Check Cache First)
        let localCurrency = localStorage.getItem(CACHE_KEY_CURRENCY);
        
        if (!localCurrency) {
          try {
            const ipRes = await fetch("https://ipapi.co/currency/");
            const code = await ipRes.text();
            if (code && code.length === 3) {
              localCurrency = code;
              localStorage.setItem(CACHE_KEY_CURRENCY, localCurrency);
            } else {
              localCurrency = "USD";
            }
          } catch (e) {
            console.warn("Failed to fetch local currency, defaulting to USD");
            localCurrency = "USD";
          }
        }

        // 2. Fetch live exchange rates from Flutterwave via Backend
        let currentRate = 1;
        
        if (localCurrency !== "USD") {
          const cachedRatesStr = localStorage.getItem(CACHE_KEY_RATES);
          let cachedRates = cachedRatesStr ? JSON.parse(cachedRatesStr) : null;

          const isCacheValid = cachedRates && (Date.now() - cachedRates.timestamp < CACHE_DURATION);

          if (isCacheValid && cachedRates.rates[localCurrency]) {
            currentRate = cachedRates.rates[localCurrency];
          } else {
            try {
              const rateRes = await getExchangeRate(localCurrency);
              if (rateRes.data?.rate) {
                currentRate = rateRes.data.rate;
                
                // Save to cache
                localStorage.setItem(CACHE_KEY_RATES, JSON.stringify({
                  timestamp: Date.now(),
                  rates: {
                    ...(cachedRates?.rates || {}),
                    [localCurrency]: currentRate
                  }
                }));
              }
            } catch (e) {
              console.warn("Failed to fetch Flutterwave exchange rate");
              if (cachedRates && cachedRates.rates[localCurrency]) {
                currentRate = cachedRates.rates[localCurrency];
              }
            }
          }
        }

        setCurrency(localCurrency);
        setRate(currentRate);
      } catch (err) {
        console.error("Local currency error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCurrencyAndRates();
  }, []);

  const convertToLocal = (usdAmount: number) => usdAmount * rate;

  const formatLocal = (usdAmount: number) => {
    const localVal = convertToLocal(usdAmount);
    
    // Format based on currency
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency,
      maximumFractionDigits: currency === 'NGN' ? 0 : 2 
    }).format(localVal);
  };

  return {
    currency,
    rate,
    isLoading,
    convertToLocal,
    formatLocal
  };
}
