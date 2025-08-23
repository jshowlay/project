import { Suspense } from 'react';
import { alertsDB } from '../../lib/alerts';
import { getUserId } from '../../lib/auth';
import AlertsHeader from '../../components/AlertsHeader';
import AlertsRulesSection from '../../components/AlertsRulesSection';
import AlertsInboxSection from '../../components/AlertsInboxSection';
import AlertsSkeleton from '../../components/AlertsSkeleton';

export default async function AlertsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<AlertsSkeleton />}>
          <AlertsContent />
        </Suspense>
      </div>
    </div>
  );
}

async function AlertsContent() {
  try {
    const userId = await getUserId();
    
    // Fetch initial data
    const [rulesData, eventsData, unreadCount] = await Promise.all([
      alertsDB.getAlertRules(userId, 1, 10),
      alertsDB.getAlertEvents(userId, 1, 10, true), // unread only
      alertsDB.getUnreadAlertCount(userId)
    ]);

    return (
      <>
        <AlertsHeader unreadCount={unreadCount} />
        
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Rules Section */}
          <div className="bg-white rounded-lg shadow">
            <AlertsRulesSection initialRules={rulesData} />
          </div>
          
          {/* Inbox Section */}
          <div className="bg-white rounded-lg shadow">
            <AlertsInboxSection initialEvents={eventsData} />
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error('Error loading alerts page:', error);
    
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg font-medium">
          Error loading alerts
        </div>
        <div className="text-gray-500 mt-2">
          Please try refreshing the page
        </div>
      </div>
    );
  }
}
