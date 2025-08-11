'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download, Share2, Calendar, Target, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { TrendCard } from '@/components/TrendCard';
import { CopyButton } from '@/components/CopyButton';
import Link from 'next/link';

interface TrendItem {
  id: string;
  keyword: string;
  score: number;
  velocity: number;
  acceleration: number;
  agreement: number;
  freshness: number;
  novelty: number;
  sources: string[];
  angles: { [platform: string]: string[] };
  hooks: { [platform: string]: string[] };
  keywords: string[];
  timestamp: string;
}

interface Brief {
  id: string;
  trends: TrendItem[];
  metadata: {
    niche: string;
    platforms: string[];
    geo: string;
    generated_at: string;
    total_trends: number;
  };
}

export default function BriefDetailPage() {
  const params = useParams();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching brief data
    const fetchBrief = async () => {
      setLoading(true);
      try {
        // Mock data - in real app, fetch from API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockBrief: Brief = {
          id: params.id as string,
          trends: [
            {
              id: '1',
              keyword: 'AI Art Generators',
              score: 92,
              velocity: 89,
              acceleration: 78,
              agreement: 95,
              freshness: 96,
              novelty: 85,
              sources: ['Google Trends', 'Reddit', 'YouTube'],
              angles: {
                'TikTok': ['Quick AI art tutorial', 'Before/after transformation', 'AI vs human art challenge'],
                'YouTube': ['Complete beginner guide', 'Advanced techniques', 'Tool comparison review']
              },
              hooks: {
                'TikTok': ['This AI created art in 30 seconds', 'POV: You discover AI art', 'I tried 5 AI art tools'],
                'YouTube': ['The Future of Digital Art is Here', 'How I Make $1000/Month with AI Art', 'Artist Reacts to AI Art']
              },
              keywords: ['AI art', 'digital art', 'artificial intelligence', 'creative tools', 'art generation'],
              timestamp: new Date().toISOString()
            },
            {
              id: '2',
              keyword: 'Sustainable Fashion',
              score: 87,
              velocity: 82,
              acceleration: 91,
              agreement: 88,
              freshness: 89,
              novelty: 76,
              sources: ['Google Trends', 'Instagram', 'News'],
              angles: {
                'TikTok': ['Thrift store hauls', 'Sustainable outfit challenges', 'Eco-friendly fashion tips'],
                'YouTube': ['Sustainable fashion documentary', 'Brand review: eco-friendly options', 'DIY sustainable fashion']
              },
              hooks: {
                'TikTok': ['I spent $50 on sustainable fashion', 'POV: Sustainable fashion is expensive', 'Thrift store finds'],
                'YouTube': ['The Truth About Fast Fashion', 'Sustainable Fashion on a Budget', 'Eco-Friendly Fashion Brands']
              },
              keywords: ['sustainable fashion', 'eco-friendly', 'thrift shopping', 'fast fashion', 'ethical clothing'],
              timestamp: new Date().toISOString()
            }
          ],
          metadata: {
            niche: 'Technology',
            platforms: ['TikTok', 'YouTube'],
            geo: 'US',
            generated_at: new Date().toISOString(),
            total_trends: 2
          }
        };
        
        setBrief(mockBrief);
      } catch (error) {
        toast.error('Failed to load brief');
      } finally {
        setLoading(false);
      }
    };

    fetchBrief();
  }, [params.id]);

  const downloadBrief = () => {
    if (!brief) return;
    
    const dataStr = JSON.stringify(brief, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trend-brief-${brief.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Brief downloaded!');
  };

  const shareBrief = () => {
    if (navigator.share) {
      navigator.share({
        title: `Trender AI Brief - ${brief?.metadata.niche}`,
        text: `Check out this trend brief for ${brief?.metadata.niche}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Toaster />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-golden"></div>
            <span className="ml-3 text-foreground">Loading brief...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Toaster />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">Brief Not Found</h1>
            <p className="text-muted-foreground mb-6">The brief you're looking for doesn't exist.</p>
            <Link href="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      
      {/* Header */}
      <header className="border-b border-gray-800 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-golden" />
                <h1 className="text-xl font-semibold text-foreground">Brief #{brief.id}</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <CopyButton 
                text={JSON.stringify(brief, null, 2)} 
                label="Brief"
                size="sm"
              />
              <Button variant="outline" size="sm" onClick={downloadBrief}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={shareBrief}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Brief Overview */}
          <Card className="bg-card border-gray-800">
            <CardHeader>
              <CardTitle className="text-2xl">Trend Brief Overview</CardTitle>
              <CardDescription>
                Comprehensive analysis for {brief.metadata.niche} trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-golden/20 rounded-lg">
                    <Target className="h-5 w-5 text-golden" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Niche</p>
                    <p className="font-medium text-foreground">{brief.metadata.niche}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-golden/20 rounded-lg">
                    <Globe className="h-5 w-5 text-golden" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Region</p>
                    <p className="font-medium text-foreground">{brief.metadata.geo}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-golden/20 rounded-lg">
                    <Calendar className="h-5 w-5 text-golden" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Generated</p>
                    <p className="font-medium text-foreground">
                      {new Date(brief.metadata.generated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator className="my-6 bg-gray-800" />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Platforms</h3>
                  <div className="flex flex-wrap gap-2">
                    {brief.metadata.platforms.map((platform) => (
                      <Badge key={platform} variant="outline" className="text-golden border-golden/30">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Trends</p>
                  <p className="text-2xl font-bold text-golden">{brief.metadata.total_trends}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trends */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">Trend Analysis</h2>
            <div className="grid grid-cols-1 gap-6">
              {brief.trends.map((trend) => (
                <TrendCard 
                  key={trend.id} 
                  trend={trend} 
                  platforms={brief.metadata.platforms}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

