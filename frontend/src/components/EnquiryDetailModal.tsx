import React from 'react';
import type { Enquiry } from '../types/erp';
import { X, Building2, Calendar, FileText, Package, User } from 'lucide-react';

interface EnquiryDetailModalProps {
  enquiry: Enquiry | null;
  onClose: () => void;
  onCreateQuotation?: (enquiry: Enquiry) => void;
}

export const EnquiryDetailModal: React.FC<EnquiryDetailModalProps> = ({
  enquiry,
  onClose,
  onCreateQuotation,
}) => {
  if (!enquiry) return null;

  const getStatusBadge = (status: string) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{enquiry.enquiryNumber}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(enquiry.status)}`}>
                  {enquiry.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">Customer Enquiry Specifications</p>
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
          
          {/* Customer Profile Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              Customer Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block">Company:</span>
                <span className="font-bold text-slate-800">{enquiry.customer?.companyName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Contact Person:</span>
                <span className="font-medium text-slate-700">{enquiry.customer?.contactPerson || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Mobile:</span>
                <span className="font-medium text-slate-700">{enquiry.customer?.mobile || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Email & City:</span>
                <span className="font-medium text-slate-700">{enquiry.customer?.email} ({enquiry.customer?.city})</span>
              </div>
            </div>
          </div>

          {/* Timeline & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Enquiry Date:
              </span>
              <span className="font-semibold text-slate-800">{enquiry.enquiryDate}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Required Delivery Date:
              </span>
              <span className="font-semibold text-blue-700">{enquiry.requiredDate}</span>
            </div>
          </div>

          {enquiry.notes && (
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs">
              <span className="font-semibold text-slate-600 block mb-0.5">Notes / Scope:</span>
              <span className="text-slate-800">{enquiry.notes}</span>
            </div>
          )}

          {/* Requested Products Line Items */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <Package className="w-4 h-4 text-blue-600" />
              Requested Product Line Items ({enquiry.items.length})
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="px-3 py-2.5">#</th>
                    <th className="px-3 py-2.5">Product Code</th>
                    <th className="px-3 py-2.5">Product Description</th>
                    <th className="px-3 py-2.5 text-right">Requested Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enquiry.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-3 py-2 font-mono font-bold text-blue-700">{item.productCode}</td>
                      <td className="px-3 py-2 font-medium text-slate-800">{item.productName}</td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900">
                        {item.quantity} {item.unit || 'PCS'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              Created by: {enquiry.createdBy || 'Sales User'}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
              {onCreateQuotation && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onCreateQuotation(enquiry);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Create Quotation Against Enquiry
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
