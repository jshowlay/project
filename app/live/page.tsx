import PrimaryNav from '@/components/PrimaryNav';
import MobileNavBar from '@/components/MobileNavBar';
import CommandPalette from '@/components/CommandPalette';

export const dynamic = 'force-static';

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <PrimaryNav />
      <CommandPalette />
      <MobileNavBar /><div className="h-12 sm:hidden" />
      <section className="mt-6">
        <h1 className="text-2xl font-semibold">Live</h1>
        <p className="opacity-80 mt-2">Your real-time stream. Use the header controls to start/stop, and filters to refine.</p>
        {/* You can render your LiveTicker list here, or reuse the dashboard grid with a live source. */}
      </section>
    </div>
  );
}
