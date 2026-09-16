import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Factory, FileText, ShoppingCart, LogOut, ShieldCheck, UserCheck, Layers } from 'lucide-react';

interface NavbarProps {
  activeTab: 'enquiries' | 'quotations' | 'sales-orders';
  setActiveTab: (tab: 'enquiries' | 'quotations' | 'sales-orders') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, isAdmin, isSales, loginAs, logout } = useAuth();

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & System Brand */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg flex items-center justify-center">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
                Apex Industrial ERP
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  PERN Stack
                </span>
              </span>
              <p className="text-xs text-slate-400 hidden sm:block">Manufacturing & Industrial Supply Chain</p>
            </div>
          </div>

          {/* Navigation Tabs (Screens 2, 3, 4) */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('enquiries')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'enquiries'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Enquiries</span>
            </button>

            <button
              onClick={() => setActiveTab('quotations')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'quotations'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Quotations</span>
            </button>

            <button
              onClick={() => setActiveTab('sales-orders')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'sales-orders'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Sales Orders & Stock</span>
            </button>
          </nav>

          {/* User Session & Role Switcher */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden md:block">
                  <div className="text-sm font-semibold text-white leading-tight">{user.fullName}</div>
                  <div className="text-xs text-slate-400">{user.email}</div>
                </div>

                {/* Role Badge */}
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    isAdmin
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                  {user.role}
                </div>

                {/* Quick Role Switcher for Assessment Demonstration */}
                <div className="hidden lg:flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
                  <button
                    onClick={() => loginAs('ADMIN')}
                    className={`px-2 py-1 rounded ${isAdmin ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
                    title="Switch to Admin Role"
                  >
                    Admin
                  </button>
                  <button
                    onClick={() => loginAs('SALES')}
                    className={`px-2 py-1 rounded ${isSales ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
                    title="Switch to Sales User Role"
                  >
                    Sales
                  </button>
                </div>

                {/* Logout */}
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : null}
          </div>

        </div>
      </div>
    </header>
  );
};
