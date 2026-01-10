/**
 * useNameFormat Composable
 * 
 * Handles name formatting based on language selection:
 * - EN mode: Show only English name (filter out Japanese)
 * - JA mode: Show katakana with kanji in brackets
 * 
 * Example formats:
 * Full name: "Shunsuke HAYASHI (駿佑) [ハヤシ シュンフケ]"
 * EN mode:   "Shunsuke HAYASHI"
 * JA mode:   "ハヤシ シュンフケ (駿佑)"
 */

import { computed } from 'vue'
import { useLanguage } from './useLanguage'

export function useNameFormat() {
  const { currentLanguage } = useLanguage()

  /**
   * Format a name based on current language setting
   * 
   * @param fullName - Full name string containing EN, kanji, and katakana
   * @returns Formatted name based on language
   */
  const formatName = computed(() => {
    return (fullName: string | undefined | null): string => {
      if (!fullName) return ''

      const lang = currentLanguage.value

      if (lang === 'en') {
        // EN mode: Extract only English name (before kanji parentheses)
        // Pattern: "Shunsuke HAYASHI (駿佑) [ハヤシ シュンフケ]" -> "Shunsuke HAYASHI"
        const match = fullName.match(/^([^([\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uFF00-\uFFEF]+?)(?:\s*[\(（\[]|$)/)
        if (match && match[1]) {
          return match[1].trim()
        }

        // Fallback: remove anything in parentheses or brackets
        return fullName
          .replace(/[\(（][^)）]*[\)）]/g, '')
          .replace(/[\[［【][^\]］】]*[\]］】]/g, '')
          .trim()
      } else {
        // JA mode: Extract katakana [in brackets] and kanji (in parentheses)
        // Pattern: "Shunsuke HAYASHI (駿佑) [ハヤシ シュンフケ]" -> "ハヤシ シュンフケ (駿佑)"
        
        // Extract katakana from square brackets
        const katakanaMatch = fullName.match(/[\[［【]([^\]］】]+)[\]］】]/)
        const katakana = katakanaMatch?.[1]?.trim() || null

        // Extract kanji from parentheses
        const kanjiMatch = fullName.match(/[\(（]([^)）]+)[\)）]/)
        const kanji = kanjiMatch?.[1]?.trim() || null

        // If we found both katakana and kanji
        if (katakana && kanji) {
          return `${katakana} (${kanji})`
        }

        // If only katakana
        if (katakana) {
          return katakana
        }

        // If only kanji
        if (kanji) {
          return kanji
        }

        // Fallback: check if the name contains Japanese characters
        const hasJapanese = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uFF00-\uFFEF]/.test(fullName)
        
        if (hasJapanese) {
          // Return as-is if it has Japanese but no brackets/parens
          return fullName.trim()
        }

        // No Japanese found, return the original name
        return fullName.trim()
      }
    }
  })

  return {
    formatName
  }
}
