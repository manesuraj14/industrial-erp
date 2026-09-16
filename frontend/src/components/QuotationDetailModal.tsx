import React from 'react';
import type { Quotation } from '../types/erp';
import { X, Layers, Building2, Calendar, FileText, Send, CheckCircle, XCircle, ShoppingCart } from 'lucide-react';

interface QuotationDetailModalProps {
  quotation: Quotation | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: any) => void;
  onConvertToOrder: (id: string) => void;
}

export const QuotationDetailModal: React.FC<QuotationDetailModalProps> = ({
  quotation,
  onClose,
  onUpdateStatus,
  onConvertToOrder,
}) => {
  if (!quotation) return null;

  const getStatusBadge = (status: string) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{quotation.quotationNumber}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(quotation.status)}`}>
                  {quotation.status}
                </span>
                {quotation.isConvertedToOrder && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                    Converted to Order
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Against Enquiry: <strong className="text-blue-700">{quotation.enquiryNumber}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          
          {/* Customer & Dates Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 flex items-center gap-1 mb-1">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Customer:
              </span>
              <div className="font-bold text-slate-800 text-sm">{quotation.customer?.companyName}</div>
              <div className="text-slate-500">{quotation.customer?.contactPerson} • {quotation.customer?.city}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Validity:
              </span>
              <div className="font-bold text-slate-800 text-sm">Valid Until: {quotation.validUntil}</div>
              <div className="text-slate-500">Quotation Status: {quotation.status}</div>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Itemized Commercial Schedule
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2.5">Product</th>
                    <th className="px-3 py-2.5 text-center">Qty</th>
                    <th className="px-3 py-2.5 text-right">Unit Price</th>
                    <th className="px-3 py-2.5 text-center">Disc %</th>
                    <th className="px-3 py-2.5 text-center">GST %</th>
                    <th className="px-3 py-2.5 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {quotation.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2.5">
                        <div className="font-mono font-bold text-blue-700">{it.productCode}</div>
                        <div className="text-slate-800 font-medium">{it.productName}</div>
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-slate-800">
                        {it.quantity} {it.unit || 'PCS'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">
                        ₹{it.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-2.5 text-center font-medium text-slate-600">
                        {it.discountPercentage}%
                      </td>
                      <td className="px-3 py-2.5 text-center font-medium text-slate-600">
                        {it.gstPercentage}%
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                        ₹{it.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mathematical Summary Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
            <div className="text-slate-500 text-[11px] space-y-0.5">
              <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                <FileText className="w-3.5 h-3.5" />
                Backend Mathematically Verified (GST Act 2017 Compliant)
              </div>
              <div>Relationship: Customer ➔ Enquiry ➔ Quotation ➔ Sales Order</div>
            </div>

            <div className="w-full sm:w-64 space-y-1 text-right">
              <div className="flex justify-between text-slate-600">
                <span>Base Amount:</span>
                <span className="font-mono">₹{quotation.totalBaseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Discount:</span>
                <span className="font-mono text-red-600">-₹{quotation.totalDiscountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total GST:</span>
                <span className="font-mono text-emerald-600">+₹{quotation.totalGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="font-mono text-blue-700 text-base">₹{quotation.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Lifecycle Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              {quotation.status === 'DRAFT' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(quotation.id, 'SENT')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Mark as Sent to Client
                </button>
              )}

              {quotation.status === 'SENT' && (
                <>
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(quotation.id, 'ACCEPTED')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Accept Quotation
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(quotation.id, 'REJECTED')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject Quotation
                  </button>
                </>
              )}

              {quotation.status === 'ACCEPTED' && !quotation.isConvertedToOrder && (
                <button
                  type="button"
                  onClick={() => {
                    onConvertToOrder(quotation.id);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Convert to Sales Order
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
