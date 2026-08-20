import type { en } from "./en";

export type Locale = "ru" | "en";
export type TranslationKey = keyof typeof en;
export type TranslationDictionary = Record<TranslationKey, string>;
export type TranslationVariables = Record<string, string | number>;
