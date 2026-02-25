'use client'

import React, { useState } from 'react'
import { useLanguage } from '@/lib/context/LanguageContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { surahs, getAyatBySurah, searchSurahs } from '@/lib/data/quran'
import { Search } from 'lucide-react'

const translations = {
  ar: {
    selectSurah: 'اختر سورة',
    search: 'ابحث عن سورة...',
    ayaCount: 'عدد الآيات',
    type: 'نوع السورة',
    quran: 'القرآن الكريم',
  },
  en: {
    selectSurah: 'Select a Surah',
    search: 'Search for a surah...',
    ayaCount: 'Ayat Count',
    type: 'Revelation Type',
    quran: 'Holy Quran',
  },
}

export function QuranViewer() {
  const { language } = useLanguage()
  const t = translations[language]
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSurah, setSelectedSurah] = useState(surahs[0])

  const searchResults = searchQuery ? searchSurahs(searchQuery) : surahs
  const ayat = getAyatBySurah(selectedSurah.number)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Surahs List */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.selectSurah}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-8"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {searchResults.map((surah) => (
                <Button
                  key={surah.number}
                  variant={selectedSurah.number === surah.number ? 'default' : 'outline'}
                  className="w-full justify-start text-right"
                  onClick={() => setSelectedSurah(surah)}
                >
                  <div className="flex-1 text-right">
                    <div className="font-semibold">{surah.name}</div>
                    <div className="text-xs opacity-70">{surah.nameEn}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Surah Content */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{selectedSurah.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{selectedSurah.nameEn}</p>
                </div>
                <Badge variant="secondary">سورة رقم {selectedSurah.number}</Badge>
              </div>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t.ayaCount}: </span>
                  <span className="font-semibold">{selectedSurah.ayaCount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t.type}: </span>
                  <span className="font-semibold">{selectedSurah.revelationType}</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 py-6">
            {ayat.map((aya) => (
              <div
                key={`${aya.surah}-${aya.aya}`}
                className="border-b pb-6 last:border-b-0"
              >
                {/* Aya Number */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-full w-8 h-8 flex items-center justify-center p-0">
                      {aya.aya}
                    </Badge>
                  </div>
                </div>

                {/* Arabic Text */}
                <div className="text-right mb-4 p-4 bg-primary/5 rounded-lg">
                  <p className="text-xl leading-loose font-arabic" style={{ direction: 'rtl' }}>
                    {aya.text}
                  </p>
                </div>

                {/* English Translation */}
                <div className="text-left p-3 bg-accent/5 rounded-lg">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {aya.translation}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
