import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Factory,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  CheckCircle2
} from 'lucide-react';

export const Login: React.FC = () => {
  const { loginAs } = useAuth();
  const [email, setEmail] = useState('admin@erp.com');
  const [password, setPassword] = useState('Password@123');

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.toLowerCase().includes('sales')) {
      loginAs('SALES');
    } else {
      loginAs('ADMIN');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-2xl border border-slate-100 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30 mb-3">
            <Factory className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Apex Industrial ERP
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Manufacturing & Supply Chain Operations Portal
          </p>
          <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            PERN Stack • Technical Assessment
          </div>
        </div>

        {/* 1-Click Fast-Switch Cards */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            1-Click Assessment Roles
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Admin Role Button */}
            <button
              type="button"
              onClick={() => loginAs('ADMIN')}
              className="flex flex-col p-3 rounded-lg bg-white border border-purple-200 text-purple-950 hover:bg-purple-50 hover:border-purple-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center gap-1.5 font-bold text-xs text-purple-700">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  ADMIN
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.2 rounded">
                  Full
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                Confirm Orders, Stock Reservation & Dispatch
              </span>
            </button>

            {/* Sales Role Button */}
            <button
              type="button"
              onClick={() => loginAs('SALES')}
              className="flex flex-col p-3 rounded-lg bg-white border border-emerald-200 text-emerald-950 hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center gap-1.5 font-bold text-xs text-emerald-700">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  SALES USER
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.2 rounded">
                  Sales
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                Create Enquiries, Quotations & Order Requests
              </span>
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <form className="mt-6 space-y-4" onSubmit={handleManualLogin}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-white"
                placeholder="admin@erp.com or sales@erp.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-white"
                placeholder="••••••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Sign In to ERP Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>PostgreSQL Relational Schema & Backend RBAC Protected</span>
        </div>
      </div>
    </div>
  );
};
