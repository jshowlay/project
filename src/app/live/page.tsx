import { Metadata } from 'next';
import LiveRadar from '@/components/live/LiveRadar';

export const metadata: Metadata = {
  title: 'Live Radar - Real-time Trend Tracking | TrendrAI',
  description: 'Track trending topics and social media momentum in real-time with our live radar. Monitor AI trends, tech news, and viral content as it happens.',
  keywords: 'live trends, real-time tracking, social media trends, AI trends, viral content, trend radar',
  openGraph: {
    title: 'Live Radar - Real-time Trend Tracking',
    description: 'Track trending topics and social media momentum in real-time',
    type: 'website',
  },
};

export default function LiveRadarPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Live Radar
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Real-time tracking of trending topics and social media momentum. 
            Watch trends emerge and evolve as they happen.
          </p>
        </div>
        
        <LiveRadar />
      </div>
    </div>
  );
}
