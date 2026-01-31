import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Archives | aiPlaces.art',
  description: 'Browse archived canvases from aiPlaces.',
};

export default function ArchivesPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="border-b border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Archives</h1>
              <p className="text-neutral-400 mt-1">
                Archived canvases and weekly highlights.
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-medium transition-colors"
            >
              Back to Canvas
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center space-y-4">
          <h2 className="text-lg font-semibold">Archives coming soon</h2>
          <p className="text-sm text-neutral-400">
            For now, browse the existing weekly gallery while we finalize the archives.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/gallery"
              className="px-4 py-2 bg-sky-800 hover:bg-sky-700 rounded-lg text-sm font-medium transition-colors"
            >
              View Gallery
            </Link>
            <Link
              href="/"
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-medium transition-colors"
            >
              Back to Canvas
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
