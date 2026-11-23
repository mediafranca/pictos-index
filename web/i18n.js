const SUPPORTED_LOCALES = ["es-419", "en-GB"];
const DEFAULT_LOCALE = "es-419";
const STORAGE_KEY = "pictos-index:ui-language:v1";

let locale = DEFAULT_LOCALE;
let catalogues = {};

export async function initI18n() {
  const entries = await Promise.all(
    SUPPORTED_LOCALES.map(async (code) => {
      const response = await fetch(new URL(`../locales/${code}.json`, import.meta.url));
      if (!response.ok) throw new Error(`Could not load locale ${code}: HTTP ${response.status}`);
      return [code, await response.json()];
    }),
  );
  catalogues = Object.fromEntries(entries);

  const saved = localStorage.getItem(STORAGE_KEY);
  locale = SUPPORTED_LOCALES.includes(saved)
    ? saved
    : navigator.language?.toLowerCase().startsWith("en")
      ? "en-GB"
      : DEFAULT_LOCALE;
  document.documentElement.lang = locale;
  return locale;
}

export function getLocale() {
  return locale;
}

export function setLocale(nextLocale) {
  if (!SUPPORTED_LOCALES.includes(nextLocale)) return false;
  locale = nextLocale;
  localStorage.setItem(STORAGE_KEY, locale);
  document.documentElement.lang = locale;
  return true;
}

export function t(key, variables = {}) {
  const value = resolveKey(catalogues[locale], key) ?? resolveKey(catalogues[DEFAULT_LOCALE], key);
  if (typeof value !== "string") {
    console.warn(`[i18n] Missing translation: ${key}`);
    return key;
  }
  return value.replace(/\{(\w+)\}/g, (match, variable) =>
    Object.hasOwn(variables, variable) ? String(variables[variable]) : match,
  );
}

// A catalogue string may mark key phrases as **phrase** to make it scannable;
// they render as <strong>, built as nodes, never as HTML.
export function marked(text) {
  const fragment = document.createDocumentFragment();
  text.split(/\*\*(.+?)\*\*/).forEach((part, index) => {
    if (!part) return;
    if (index % 2) {
      const strong = document.createElement("strong");
      strong.textContent = part;
      fragment.append(strong);
    } else {
      fragment.append(part);
    }
  });
  return fragment;
}

export function applyTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((node) => {
    const variables = node.dataset.i18nVars ? JSON.parse(node.dataset.i18nVars) : {};
    node.replaceChildren(marked(t(node.dataset.i18n, variables)));
  });

  const translatedAttributes = ["aria-label", "placeholder", "title", "content", "alt"];
  translatedAttributes.forEach((attribute) => {
    const dataName = `i18n${attribute.split("-").map(capitalise).join("")}`;
    root.querySelectorAll(`[data-i18n-${attribute}]`).forEach((node) => {
      node.setAttribute(attribute, t(node.dataset[dataName]));
    });
  });
}

function resolveKey(catalogue, key) {
  return key.split(".").reduce((value, part) => value?.[part], catalogue);
}

function capitalise(value, index) {
  return index === 0 ? value[0].toUpperCase() + value.slice(1) : value[0].toUpperCase() + value.slice(1);
}
