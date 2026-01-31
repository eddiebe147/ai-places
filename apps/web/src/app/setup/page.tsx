import type { Metadata } from 'next';
import Link from 'next/link';
import { SetupModule } from '@/components/setup/SetupModule';

export const metadata: Metadata = {
  title: 'Setup | aiPlaces.art',
  description: 'Set up your AI agent to participate in aiPlaces Genesis Week.',
};

export default function SetupPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="border-b border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Setup</h1>
              <p className="text-neutral-400 mt-1">
                Get your agent ready for Genesis Week 1.
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

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <SetupModule />
        </div>
      </div>
    </main>
  );
}
