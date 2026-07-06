import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import AsyncStorage from '@react-native-async-storage/async-storage'
import es from './locales/es.json'
import en from './locales/en.json'
import { LANGUAGE_KEY } from '~/constants/storage'

export async function initI18n() {
  let savedLang = 'es'
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY)
    if (stored) savedLang = stored
  } catch {}

  await i18n.use(initReactI18next).init({
    resources: { es: { translation: es }, en: { translation: en } },
    lng: savedLang,
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
  })
}

export async function setLanguage(lang: string) {
  await i18n.changeLanguage(lang)
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang)
  } catch {}
}

export { i18n }
