import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { InventoryBar } from './components/InventoryBar';
import { Login } from './pages/Login';
import { Enquiries } from './pages/Enquiries';
import { Quotations } from './pages/Quotations';
import { SalesOrders } from './pages/SalesOrders';
import { mockErp } from './services/mockErpService';

function MainLayout() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'enquiries' | 'quotations' | 'sales-orders'>('enquiries');
  const [inventory, setInventory] = useState(() => mockErp.getInventory());

  if (!isAuthenticated || !user) {
    return <Login />;
  }

  const refreshInventory = () => {
    setInventory(mockErp.getInventory());
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* Live Inventory Status Bar (Reactive to Reservations & Dispatches) */}
        <InventoryBar inventory={inventory} />

        {/* Tab Content: The 3 Main Business Screens */}
        {activeTab === 'enquiries' && (
          <Enquiries
            onNavigateToQuotation={() => {
              setActiveTab('quotations');
            }}
          />
        )}

        {activeTab === 'quotations' && (
          <Quotations
            onNavigateToOrders={() => {
              setActiveTab('sales-orders');
            }}
          />
        )}

        {activeTab === 'sales-orders' && (
          <SalesOrders
            onStockUpdated={refreshInventory}
          />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        Industrial ERP Operations System • PERN Stack Architecture • 48-Hour Technical Case Study
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
