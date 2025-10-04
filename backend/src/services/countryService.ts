import axios from "axios";

interface CountryData {
  name: {
    common: string;
    official: string;
  };
  currencies: Record<
    string,
    {
      name: string;
      symbol: string;
    }
  >;
}

interface CountryCurrency {
  country: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
}

let cachedCountries: CountryCurrency[] | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetches all countries and their currencies from REST Countries API
 * Results are cached for 24 hours to avoid excessive API calls
 */
export async function fetchCountriesWithCurrencies(): Promise<CountryCurrency[]> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (cachedCountries && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedCountries;
  }

  try {
    const response = await axios.get<CountryData[]>(
      "https://restcountries.com/v3.1/all?fields=name,currencies"
    );

    const countries: CountryCurrency[] = [];

    response.data.forEach((country) => {
      if (country.currencies) {
        // Most countries have one currency, but some have multiple
        const currencyEntries = Object.entries(country.currencies);
        
        currencyEntries.forEach(([code, currency]) => {
          countries.push({
            country: country.name.common,
            currencyCode: code,
            currencyName: currency.name,
            currencySymbol: currency.symbol || code,
          });
        });
      }
    });

    // Sort alphabetically by country name
    countries.sort((a, b) => a.country.localeCompare(b.country));

    // Update cache
    cachedCountries = countries;
    lastFetchTime = now;

    return countries;
  } catch (error) {
    console.error("Failed to fetch countries:", error);
    
    // If cache exists but is stale, return it anyway
    if (cachedCountries) {
      console.log("Using stale country cache due to API error");
      return cachedCountries;
    }

    // Fallback to basic list if API fails and no cache
    return getFallbackCountries();
  }
}

/**
 * Gets the primary currency for a specific country
 */
export async function getCurrencyForCountry(countryName: string): Promise<string> {
  const countries = await fetchCountriesWithCurrencies();
  
  const country = countries.find(
    (c) => c.country.toLowerCase() === countryName.toLowerCase()
  );

  return country?.currencyCode || "USD";
}

/**
 * Fallback list of major countries and currencies
 * Used when API is unavailable
 */
function getFallbackCountries(): CountryCurrency[] {
  return [
    { country: "United States", currencyCode: "USD", currencyName: "United States Dollar", currencySymbol: "$" },
    { country: "United Kingdom", currencyCode: "GBP", currencyName: "British Pound Sterling", currencySymbol: "£" },
    { country: "Germany", currencyCode: "EUR", currencyName: "Euro", currencySymbol: "€" },
    { country: "France", currencyCode: "EUR", currencyName: "Euro", currencySymbol: "€" },
    { country: "India", currencyCode: "INR", currencyName: "Indian Rupee", currencySymbol: "₹" },
    { country: "Canada", currencyCode: "CAD", currencyName: "Canadian Dollar", currencySymbol: "CA$" },
    { country: "Australia", currencyCode: "AUD", currencyName: "Australian Dollar", currencySymbol: "A$" },
    { country: "Japan", currencyCode: "JPY", currencyName: "Japanese Yen", currencySymbol: "¥" },
    { country: "China", currencyCode: "CNY", currencyName: "Chinese Yuan", currencySymbol: "¥" },
    { country: "Brazil", currencyCode: "BRL", currencyName: "Brazilian Real", currencySymbol: "R$" },
    { country: "South Africa", currencyCode: "ZAR", currencyName: "South African Rand", currencySymbol: "R" },
    { country: "Mexico", currencyCode: "MXN", currencyName: "Mexican Peso", currencySymbol: "Mex$" },
  ].sort((a, b) => a.country.localeCompare(b.country));
}

/**
 * Gets a list of unique countries (no duplicates)
 */
export async function getUniqueCountries(): Promise<{ country: string; currencyCode: string }[]> {
  const countries = await fetchCountriesWithCurrencies();
  
  // Create a map to handle countries with multiple currencies
  // We'll take the first currency for each country
  const uniqueMap = new Map<string, string>();
  
  countries.forEach((c) => {
    if (!uniqueMap.has(c.country)) {
      uniqueMap.set(c.country, c.currencyCode);
    }
  });

  return Array.from(uniqueMap.entries())
    .map(([country, currencyCode]) => ({ country, currencyCode }))
    .sort((a, b) => a.country.localeCompare(b.country));
}
