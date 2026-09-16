import React, { useState } from 'react';
import { mockErp } from '../services/mockErpService';
import type { Enquiry, EnquiryStatus } from '../types/erp';
import { CreateEnquiryModal } from '../components/CreateEnquiryModal';
import { EnquiryDetailModal } from '../components/EnquiryDetailModal';
import {
  FileText,
  Plus,
  Search,
  Building2,
  Calendar,
  Eye,
  Clock,
  Award,
  AlertCircle
} from 'lucide-react';

interface EnquiriesPageProps {
  onNavigateToQuotation?: (enquiryId?: string) => void;
}

export const Enquiries: React.FC<EnquiriesPageProps> = ({ onNavigateToQuotation }) => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>(() => mockErp.getEnquiries());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | EnquiryStatus>('ALL');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);

  const refreshEnquiries = () => {
    setEnquiries(mockErp.getEnquiries());
  };

  const filteredEnquiries = enquiries.filter((enq) => {
    const matchesStatus = statusFilter === 'ALL' || enq.status === statusFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      enq.enquiryNumber.toLowerCase().includes(query) ||
      (enq.customer?.companyName || '').toLowerCase().includes(query) ||
      (enq.customer?.contactPerson || '').toLowerCase().includes(query) ||
      (enq.customer?.city || '').toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: EnquiryStatus) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'QUOTED':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'WON':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'LOST':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // Metrics
  const countTotal = enquiries.length;
  const countNew = enquiries.filter((e) => e.status === 'NEW').length;
  const countQuoted = enquiries.filter((e) => e.status === 'QUOTED').length;
  const countWon = enquiries.filter((e) => e.status === 'WON').length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Customer Enquiries (Screen 2)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Capture prospective customer requirements, contact details, and multi-product items
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer Enquiry</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Enquiries</div>
            <div className="text-xl font-extrabold text-slate-800 mt-0.5">{countTotal}</div>
          </div>
          <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-blue-600 font-medium">New Enquiries</div>
            <div className="text-xl font-extrabold text-blue-700 mt-0.5">{countNew}</div>
          </div>
          <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-600 font-medium">Quoted Active</div>
            <div className="text-xl font-extrabold text-amber-700 mt-0.5">{countQuoted}</div>
          </div>
          <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-emerald-600 font-medium">Won Orders</div>
            <div className="text-xl font-extrabold text-emerald-700 mt-0.5">{countWon}</div>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          {(['ALL', 'NEW', 'QUOTED', 'WON', 'LOST'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company, enquiry #, city..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Enquiry #</th>
                <th className="px-4 py-3">Customer Profile</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Required By</th>
                <th className="px-4 py-3">Product Lines</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No customer enquiries found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredEnquiries.map((enq) => (
                  <tr key={enq.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">
                      {enq.enquiryNumber}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {enq.customer?.companyName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {enq.customer?.contactPerson} • {enq.customer?.mobile}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-medium text-slate-700">
                      {enq.customer?.city}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {enq.enquiryDate}
                    </td>

                    <td className="px-4 py-3 font-semibold text-blue-700 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      {enq.requiredDate}
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {enq.items.length} Product{enq.items.length > 1 ? 's' : ''}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(enq.status)}`}>
                        {enq.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedEnquiry(enq)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Items
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreateEnquiryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={refreshEnquiries}
      />

      <EnquiryDetailModal
        enquiry={selectedEnquiry}
        onClose={() => setSelectedEnquiry(null)}
        onCreateQuotation={(enq) => {
          if (onNavigateToQuotation) {
            onNavigateToQuotation(enq.id);
          }
        }}
      />

    </div>
  );
};
