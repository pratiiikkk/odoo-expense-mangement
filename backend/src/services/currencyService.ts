import axios from "axios";

interface ExchangeRateResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

interface ConversionResult {
  from: string;
  to: string;
  amount: number;
  converted: number;
  rate: number;
  date: string;
}

const exchangeRateCache = new Map<string, { data: ExchangeRateResponse; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Fetches exchange rates for a base currency
 * Results are cached for 1 hour
 */
export async function getExchangeRates(baseCurrency: string): Promise<ExchangeRateResponse> {
  const now = Date.now();
  const cached = exchangeRateCache.get(baseCurrency);

  // Return cached data if still valid
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const response = await axios.get<ExchangeRateResponse>(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
    );

    // Update cache
    exchangeRateCache.set(baseCurrency, {
      data: response.data,
      timestamp: now,
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to fetch exchange rates for ${baseCurrency}:`, error);

    // If cache exists but is stale, return it anyway
    if (cached) {
      console.log(`Using stale exchange rate cache for ${baseCurrency}`);
      return cached.data;
    }

    throw new Error(`Unable to fetch exchange rates for ${baseCurrency}`);
  }
}

/**
 * Converts an amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<ConversionResult> {
  // If currencies are the same, no conversion needed
  if (fromCurrency === toCurrency) {
    return {
      from: fromCurrency,
      to: toCurrency,
      amount,
      converted: amount,
      rate: 1,
      date: new Date().toISOString().split("T")[0],
    };
  }

  try {
    const rates = await getExchangeRates(fromCurrency);
    const rate = rates.rates[toCurrency];

    if (!rate) {
      throw new Error(`Exchange rate not found for ${toCurrency}`);
    }

    const converted = amount * rate;

    return {
      from: fromCurrency,
      to: toCurrency,
      amount,
      converted: parseFloat(converted.toFixed(2)),
      rate: parseFloat(rate.toFixed(4)),
      date: rates.date,
    };
  } catch (error) {
    console.error("Currency conversion error:", error);
    throw error;
  }
}

/**
 * Converts multiple amounts to a target currency
 * Useful for expense reports and dashboards
 */
export async function convertMultiple(
  conversions: Array<{ amount: number; from: string }>,
  toCurrency: string
): Promise<ConversionResult[]> {
  const uniqueCurrencies = [...new Set(conversions.map((c) => c.from))];
  
  // Fetch all needed exchange rates in parallel
  const ratesPromises = uniqueCurrencies.map(async (currency) => {
    if (currency === toCurrency) return null;
    try {
      return { currency, rates: await getExchangeRates(currency) };
    } catch {
      return null;
    }
  });

  const ratesData = (await Promise.all(ratesPromises)).filter(Boolean) as Array<{
    currency: string;
    rates: ExchangeRateResponse;
  }>;

  const ratesMap = new Map(ratesData.map((r) => [r.currency, r.rates]));

  // Perform conversions
  return conversions.map(({ amount, from }) => {
    if (from === toCurrency) {
      return {
        from,
        to: toCurrency,
        amount,
        converted: amount,
        rate: 1,
        date: new Date().toISOString().split("T")[0],
      };
    }

    const rates = ratesMap.get(from);
    if (!rates) {
      throw new Error(`Exchange rates not available for ${from}`);
    }

    const rate = rates.rates[toCurrency];
    if (!rate) {
      throw new Error(`Exchange rate not found for ${toCurrency}`);
    }

    const converted = amount * rate;

    return {
      from,
      to: toCurrency,
      amount,
      converted: parseFloat(converted.toFixed(2)),
      rate: parseFloat(rate.toFixed(4)),
      date: rates.date,
    };
  });
}

/**
 * Gets available currencies from exchange rate API
 */
export async function getAvailableCurrencies(baseCurrency = "USD"): Promise<string[]> {
  try {
    const rates = await getExchangeRates(baseCurrency);
    return [baseCurrency, ...Object.keys(rates.rates)].sort();
  } catch (error) {
    console.error("Failed to fetch available currencies:", error);
    // Return common currencies as fallback
    return ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY", "CNY", "BRL", "ZAR"].sort();
  }
}
