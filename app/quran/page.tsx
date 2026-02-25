import { Navbar } from '@/components/layout/Navbar'
import { QuranViewer } from '@/components/quran/QuranViewer'

export const metadata = {
  title: 'القرآن الكريم - Quran Viewer',
  description: 'اقرأ واستمع للقرآن الكريم مع الترجمات - Read and learn the Holy Quran',
}

export default function QuranPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">القرآن الكريم</h1>
            <p className="text-muted-foreground">استكشف القرآن الكريم مع الترجمات والتفاسير</p>
          </div>
          <QuranViewer />
        </div>
      </main>
    </>
  )
}
