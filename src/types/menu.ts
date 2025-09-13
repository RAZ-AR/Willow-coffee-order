export const LANGS = ["en", "sr", "ru"] as const;
export type Lang = (typeof LANGS)[number];

export interface MenuItem {
  id: string;
  category: string;
  title_en: string;
  title_sr: string;
  title_ru: string;
  volume?: string;
  price: number;
  composition_en?: string;
  composition_sr?: string;
  composition_ru?: string;
  image?: string;
}

export interface AdItem {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  link?: string;
}