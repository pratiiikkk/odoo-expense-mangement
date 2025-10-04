import { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import {
  fetchCountriesWithCurrencies,
  getUniqueCountries,
  getCurrencyForCountry,
} from "../services/countryService";
import {
  getExchangeRates,
  convertCurrency,
  getAvailableCurrencies,
} from "../services/currencyService";

/**
 * Get all countries with their currencies
 * GET /api/countries
 */
export const getCountries = asyncHandler(async (_req: Request, res: Response) => {
  const countries = await fetchCountriesWithCurrencies();
  res.json({
    count: countries.length,
    countries,
  });
});

/**
 * Get unique countries (one entry per country)
 * GET /api/countries/unique
 */
export const getUniqueCountriesList = asyncHandler(async (_req: Request, res: Response) => {
  const countries = await getUniqueCountries();
  res.json({
    count: countries.length,
    countries,
  });
});

/**
 * Get currency for a specific country
 * GET /api/countries/:countryName/currency
 */
export const getCountryCurrency = asyncHandler(async (req: Request, res: Response) => {
  const { countryName } = req.params;
  const currencyCode = await getCurrencyForCountry(countryName);
  
  res.json({
    country: countryName,
    currencyCode,
  });
});

/**
 * Get exchange rates for a base currency
 * GET /api/currencies/rates/:baseCurrency
 */
export const getCurrencyRates = asyncHandler(async (req: Request, res: Response) => {
  const { baseCurrency } = req.params;
  const rates = await getExchangeRates(baseCurrency.toUpperCase());
  
  res.json(rates);
});

/**
 * Convert currency
 * POST /api/currencies/convert
 * Body: { amount, from, to }
 */
export const convertCurrencyEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const { amount, from, to } = req.body;

  if (!amount || !from || !to) {
    res.status(400).json({ error: "amount, from, and to are required" });
    return;
  }

  const result = await convertCurrency(
    parseFloat(amount),
    from.toUpperCase(),
    to.toUpperCase()
  );

  res.json(result);
});

/**
 * Get list of available currencies
 * GET /api/currencies
 */
export const getCurrencies = asyncHandler(async (_req: Request, res: Response) => {
  const currencies = await getAvailableCurrencies();
  
  res.json({
    count: currencies.length,
    currencies,
  });
});
