import { Metadata } from 'next';
import TrendCardModal from '@/components/trends/TrendCardModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SaveButton from '@/components/trends/SaveButton';
import { Trend } from '@/types/trends';

export const metadata: Metadata = {
  title: 'Trend Modal Demo - TrendrAI',
  description: 'Demo showcasing the Trend Card Modal component with interactive sparklines and score pills.',
};

// Mock data with realistic trend progression
const mockTrends: Trend[] = [
  {
    id: '1',
    title: 'Artificial Intelligence and Machine Learning',
    score: 87.5,
    sparkData: [45, 52, 61, 58, 67, 73, 79, 82, 85, 87, 89, 87, 85, 87, 88]
  },
  {
    id: '2',
    title: 'Sustainable Energy Solutions',
    score: 72.3,
    sparkData: [38, 42, 45, 48, 52, 58, 63, 67, 69, 71, 73, 72, 71, 72, 73]
  },
  {
    id: '3',
    title: 'Remote Work Technologies',
    score: 65.8,
    sparkData: [55, 58, 62, 59, 61, 64, 66, 68, 65, 67, 66, 65, 66, 67, 66]
  },
  {
    id: '4',
    title: 'Cybersecurity Threats',
    score: 45.2,
    sparkData: [42, 44, 43, 45, 47, 46, 44, 45, 46, 45, 44, 45, 46, 45, 45]
  },
  {
    id: '5',
    title: 'Cryptocurrency Market',
    score: 23.7,
    sparkData: [35, 32, 28, 25, 22, 20, 18, 21, 24, 26, 25, 24, 23, 24, 24]
  },
  {
    id: '6',
    title: 'Social Media Trends',
    score: 15.4,
    sparkData: [25, 22, 20, 18, 16, 15, 14, 15, 16, 17, 16, 15, 14, 15, 15]
  }
];

export default function TrendModalDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Trend Modal Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Interactive demonstration of the Trend Card Modal component featuring 
            score pills, sparklines, and responsive design.
          </p>
        </div>

        {/* Demo Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {mockTrends.map((trend) => (
            <Card key={trend.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{trend.title}</CardTitle>
                <CardDescription>
                  Click to view detailed trend analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <SaveButton 
                    trend={trend} 
                    size="sm" 
                    showLabel={true}
                    className="flex-1"
                  />
                  <TrendCardModal 
                    trend={trend}
                    trigger={
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Component Features</CardTitle>
              <CardDescription>
                Key features and capabilities of the Trend Card Modal system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">ScorePill Component</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Color-coded score ranges (80+ emerald, 60+ lime, etc.)</li>
                    <li>• Accessible with ARIA labels and tooltips</li>
                    <li>• Configurable sizes and styling</li>
                    <li>• Fixed decimal precision (1 decimal place)</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Sparkline Component</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Responsive Recharts LineChart integration</li>
                    <li>• Supports both number[] and object[] data formats</li>
                    <li>• Interactive tooltips with data points</li>
                    <li>• Configurable height, stroke width, and colors</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">TrendCardModal Component</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• shadcn/ui Dialog integration</li>
                    <li>• Customizable trigger elements</li>
                    <li>• Controlled open/close state management</li>
                    <li>• Responsive design with max-width constraints</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Accessibility & UX</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Keyboard navigation support</li>
                    <li>• Screen reader compatibility</li>
                    <li>• Proper ARIA labels and roles</li>
                    <li>• Smooth animations and transitions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Try clicking on any trend card to see the modal in action. 
            The sparklines show trend progression over time, and score pills 
            indicate the current trending momentum.
          </p>
        </div>
      </div>
    </div>
  );
}
