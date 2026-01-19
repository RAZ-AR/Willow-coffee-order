export const BRAND = { name: "Willow", accent: "#14b8a6" } as const;

export const BACKEND_URL =
  "https://script.google.com/macros/s/AKfycbw1a8OrIJSN71gHli_3P28HIfSJUV5LlOeSmdt6XMCqyxhyDdPE_Q3Ij0REYZMS4-rO/exec";

export const SHEET_JSON_URLS = {
  menu: "https://opensheet.elk.sh/1DQ00jxOF5QnIxNnYhnRdOqB9DXeRLB65L3eF6pSQMHw/MENU",
  ads: "https://opensheet.elk.sh/1DQ00jxOF5QnIxNnYhnRdOqB9DXeRLB65L3eF6pSQMHw/ADS",
} as const;

export const LS_KEYS = {
  cart: "willow_cart",
  lang: "willow_lang", 
  stars: "willow_stars",
  card: "willow_card",
  owner: "willow_owner_tg_id",
} as const;

export const LANGS = ["en", "sr", "ru"] as const;