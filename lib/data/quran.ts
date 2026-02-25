import { Surah, Aya } from '@/lib/types'

export const surahs: Surah[] = [
  { number: 1, name: 'الفاتحة', nameEn: 'Al-Fatihah', ayaCount: 7, revelationType: 'Meccan' },
  { number: 2, name: 'البقرة', nameEn: 'Al-Baqarah', ayaCount: 286, revelationType: 'Medinan' },
  { number: 3, name: 'آل عمران', nameEn: 'Al-Imran', ayaCount: 200, revelationType: 'Medinan' },
  { number: 4, name: 'النساء', nameEn: 'An-Nisa', ayaCount: 176, revelationType: 'Medinan' },
  { number: 5, name: 'المائدة', nameEn: 'Al-Maidah', ayaCount: 120, revelationType: 'Medinan' },
  { number: 36, name: 'يس', nameEn: 'Ya-Sin', ayaCount: 83, revelationType: 'Meccan' },
  { number: 55, name: 'الرحمن', nameEn: 'Ar-Rahman', ayaCount: 78, revelationType: 'Medinan' },
  { number: 112, name: 'الإخلاص', nameEn: 'Al-Ikhlas', ayaCount: 4, revelationType: 'Meccan' },
]

export const ayatByArabic: Aya[] = [
  // Al-Fatihah (Chapter 1)
  { surah: 1, aya: 1, text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', translation: 'In the name of Allah, the Most Gracious, the Most Merciful.' },
  { surah: 1, aya: 2, text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', translation: 'All praise is due to Allah, Lord of all the worlds.' },
  { surah: 1, aya: 3, text: 'الرَّحْمَٰنِ الرَّحِيمِ', translation: 'The Most Gracious, the Most Merciful.' },
  { surah: 1, aya: 4, text: 'مَالِكِ يَوْمِ الدِّينِ', translation: 'Master of the Day of Judgment.' },
  { surah: 1, aya: 5, text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', translation: 'You alone we worship, and You alone we ask for help.' },
  { surah: 1, aya: 6, text: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', translation: 'Guide us to the straight path.' },
  { surah: 1, aya: 7, text: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', translation: 'The path of those upon whom You have bestowed favor, not of those who have earned [Your] anger or of those who are astray.' },

  // Ya-Sin (Chapter 36) - Selected verses
  { surah: 36, aya: 1, text: 'يس', translation: 'Ya-Sin.' },
  { surah: 36, aya: 2, text: 'وَالْقُرْآنِ الْحَكِيمِ', translation: 'By the wise Quran,' },
  { surah: 36, aya: 3, text: 'إِنَّكَ لَمِنَ الْمُرْسَلِينَ', translation: 'Indeed, you are from the messengers,' },
  { surah: 36, aya: 4, text: 'عَلَىٰ صِرَاطٍ مُسْتَقِيمٍ', translation: 'On a straight path.' },
  { surah: 36, aya: 5, text: 'تَنزِيلَ الْعَزِيزِ الرَّحِيمِ', translation: '[This is] a revelation of the Exalted in Might, the Merciful,' },

  // Ar-Rahman (Chapter 55) - Selected verses
  { surah: 55, aya: 1, text: 'الرَّحْمَٰنُ', translation: 'The Most Merciful' },
  { surah: 55, aya: 2, text: 'عَلَّمَ الْقُرْآنَ', translation: '[He] taught the Qur\'an.' },
  { surah: 55, aya: 3, text: 'خَلَقَ الْإِنسَانَ', translation: '[He] created mankind.' },
  { surah: 55, aya: 4, text: 'عَلَّمَهُ الْبَيَانَ', translation: '[And] taught him eloquent speech.' },

  // Al-Ikhlas (Chapter 112) - The Sincerity
  { surah: 112, aya: 1, text: 'قُلْ هُوَ اللَّهُ أَحَدٌ', translation: 'Say, "He is Allah, [the] One,' },
  { surah: 112, aya: 2, text: 'اللَّهُ الصَّمَدُ', translation: 'Allah, the Eternal Refuge.' },
  { surah: 112, aya: 3, text: 'لَمْ يَلِدْ وَلَمْ يُولَدْ', translation: 'He neither begets nor is born,' },
  { surah: 112, aya: 4, text: 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ', translation: 'And there is not to Him any equivalent."' },
]

export const getSurahByNumber = (number: number): Surah | undefined => {
  return surahs.find(s => s.number === number)
}

export const getAyatBySurah = (surahNumber: number): Aya[] => {
  return ayatByArabic.filter(a => a.surah === surahNumber)
}

export const getAyaById = (surah: number, aya: number): Aya | undefined => {
  return ayatByArabic.find(a => a.surah === surah && a.aya === aya)
}

export const searchSurahs = (query: string): Surah[] => {
  const lowerQuery = query.toLowerCase()
  return surahs.filter(
    s => s.name.includes(query) || 
         s.nameEn.toLowerCase().includes(lowerQuery) ||
         s.number.toString() === query
  )
}
