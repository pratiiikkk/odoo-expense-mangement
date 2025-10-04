import { Router } from "express";
import {
  getCountries,
  getUniqueCountriesList,
  getCountryCurrency,
  getCurrencyRates,
  convertCurrencyEndpoint,
  getCurrencies,
} from "../controllers/countryController";

const router = Router();

// Country endpoints (public - needed for signup)
router.get("/countries", getCountries);
router.get("/countries/unique", getUniqueCountriesList);
router.get("/countries/:countryName/currency", getCountryCurrency);

// Currency endpoints (public - needed for expense submission)
router.get("/currencies", getCurrencies);
router.get("/currencies/rates/:baseCurrency", getCurrencyRates);
router.post("/currencies/convert", convertCurrencyEndpoint);

export default router;
