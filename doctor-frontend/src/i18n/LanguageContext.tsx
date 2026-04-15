import { createContext, useContext } from 'react';
import type { LangCode } from './translations';
import { createT } from './translations';

interface LanguageCtx {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (key: string) => string;
}

const noop = () => {};

export const LanguageContext = createContext<LanguageCtx>({
  lang: 'en',
  setLang: noop,
  t: createT('en'),
});

export function useTranslation() {
  return useContext(LanguageContext);
}
