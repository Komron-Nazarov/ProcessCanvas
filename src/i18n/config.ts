import { en } from "./en";
import { ru } from "./ru";
import type { Locale, TranslationDictionary } from "./types";

export const DEFAULT_LOCALE: Locale = "ru";
export const dictionaries: Record<Locale, TranslationDictionary> = { ru, en };
export const locales: Locale[] = ["ru", "en"];
