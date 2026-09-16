import React, { useState } from 'react';
import { mockErp } from '../services/mockErpService';
import type { Quotation, QuotationStatus } from '../types/erp';
import { CreateQuotationModal } from '../components/CreateQuotationModal';
import { QuotationDetailModal } from '../components/QuotationDetailModal';
import {
  Layers,
  Plus,
  Search,
  Building2,
  Calendar,
  Send,
  CheckCircle,
  XCircle,
  ShoppingCart,
  Eye,
  FileCheck,
  AlertCircle
} from 'lucide-react';

interface QuotationsPageProps {
  onNavigateToOrders?: () => void;
}

export const Quotations: React.FC<QuotationsPageProps> = ({ onNavigateToOrders }) => {
  const [quotations, setQuotations] = useState<Quotation[]>(() => mockErp.getQuotations());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | QuotationStatus>('ALL');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const refreshData = () => {
    setQuotations(mockErp.getQuotations());
  };

  const handleUpdateStatus = (id: string, status: QuotationStatus) => {
    try {
      mockErp.updateQuotationStatus(id, status);
      refreshData();
      setFeedbackMsg({
        type: 'success',
        text: `Quotation status updated to "${status}" successfully.`,
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Status update failed' });
    }
  };

  const handleConvertToOrder = (id: string) => {
    try {
      const order = mockErp.convertQuotationToOrder(id);
      refreshData();
      setFeedbackMsg({
        type: 'success',
        text: `Quotation successfully converted to Sales Order "${order.orderNumber}"! (Status: PENDING)`,
      });
      setTimeout(() => setFeedbackMsg(null), 5000);
      if (onNavigateToOrders) {
        setTimeout(() => onNavigateToOrders(), 1500);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Conversion failed' });
    }
  };

  const filtered = quotations.filter((q) => {
    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      q.quotationNumber.toLowerCase().includes(query) ||
      (q.enquiryNumber || '').toLowerCase().includes(query) ||
      (q.customer?.companyName || '').toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: QuotationStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'SENT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ACCEPTED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // Metrics
  const countTotal = quotations.length;
  const countDraft = quotations.filter((q) => q.status === 'DRAFT').length;
  const countSent = quotations.filter((q) => q.status === 'SENT').length;
  const countAccepted = quotations.filter((q) => q.status === 'ACCEPTED').length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600" />
            Quotations Management (Screen 3)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate itemized quotations, calculate discount & 18% GST, and convert accepted quotations to Sales Orders
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Commercial Quotation</span>
        </button>
      </div>

      {/* Notification Toast */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Quotations</div>
            <div className="text-xl font-extrabold text-slate-800 mt-0.5">{countTotal}</div>
          </div>
          <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-600 font-medium">Draft State</div>
            <div className="text-xl font-extrabold text-slate-700 mt-0.5">{countDraft}</div>
          </div>
          <div className="p-2.5 bg-slate-100 rounded-lg text-slate-500">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-blue-600 font-medium">Sent to Client</div>
            <div className="text-xl font-extrabold text-blue-700 mt-0.5">{countSent}</div>
          </div>
          <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
            <Send className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-emerald-600 font-medium">Accepted (Ready for SO)</div>
            <div className="text-xl font-extrabold text-emerald-700 mt-0.5">{countAccepted}</div>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          {(['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'] as const).map((st) => (
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

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search quotation #, enquiry #, client..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Quotation #</th>
                <th className="px-4 py-3">Enquiry Ref</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Valid Until</th>
                <th className="px-4 py-3 text-right">Grand Total (₹)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Quick Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No quotations found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">
                      {q.quotationNumber}
                    </td>

                    <td className="px-4 py-3 font-mono font-semibold text-slate-600">
                      {q.enquiryNumber}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {q.customer?.companyName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {q.items.length} Product line{q.items.length > 1 ? 's' : ''}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {q.validUntil}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 text-sm">
                      ₹{q.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(q.status)}`}>
                          {q.status}
                        </span>
                        {q.isConvertedToOrder && (
                          <span className="text-[9px] font-extrabold uppercase text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                            Converted
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {q.status === 'DRAFT' && (
                          <button
                            onClick={() => handleUpdateStatus(q.id, 'SENT')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                            title="Mark as Sent"
                          >
                            <Send className="w-3 h-3" />
                            Send
                          </button>
                        )}

                        {q.status === 'SENT' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(q.id, 'ACCEPTED')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                              title="Accept Quotation"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Accept
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(q.id, 'REJECTED')}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                              title="Reject Quotation"
                            >
                              <XCircle className="w-3 h-3" />
                              Reject
                            </button>
                          </>
                        )}

                        {q.status === 'ACCEPTED' && !q.isConvertedToOrder && (
                          <button
                            onClick={() => handleConvertToOrder(q.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                            title="Convert to Sales Order"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            Convert to SO
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedQuotation(q)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreateQuotationModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={refreshData}
      />

      <QuotationDetailModal
        quotation={selectedQuotation}
        onClose={() => setSelectedQuotation(null)}
        onUpdateStatus={handleUpdateStatus}
        onConvertToOrder={handleConvertToOrder}
      />

    </div>
  );
};
