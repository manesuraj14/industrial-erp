import React, { useState, useEffect } from 'react';
import { mockErp } from '../services/mockErpService';
import type { Enquiry } from '../types/erp';
import { X, Layers, Calendar, Calculator, Percent, Sparkles } from 'lucide-react';

interface CreateQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preSelectedEnquiryId?: string;
}

interface QuotationDraftLine {
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  gstPercentage: number;
}

export const CreateQuotationModal: React.FC<CreateQuotationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preSelectedEnquiryId,
}) => {
  const enquiries: Enquiry[] = mockErp.getEnquiries();
  const products = mockErp.getProducts();

  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string>(
    preSelectedEnquiryId || enquiries[0]?.id || ''
  );

  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  const [lines, setLines] = useState<QuotationDraftLine[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // When enquiry selection changes, populate line items from enquiry
  useEffect(() => {
    if (!selectedEnquiryId) return;
    const enq = enquiries.find((e) => e.id === selectedEnquiryId);
    if (!enq) return;

    const initialLines: QuotationDraftLine[] = enq.items.map((it) => {
      const prod = products.find((p) => p.id === it.productId);
      return {
        productId: it.productId,
        productCode: it.productCode || prod?.productCode || '',
        productName: it.productName || prod?.productName || '',
        unit: it.unit || prod?.unit || 'PCS',
        quantity: it.quantity,
        unitPrice: prod?.basePrice || 1000,
        discountPercentage: 10, // default 10% commercial discount
        gstPercentage: 18, // default 18% GST
      };
    });

    setLines(initialLines);
  }, [selectedEnquiryId]);

  if (!isOpen) return null;

  const handleLineChange = (index: number, field: keyof QuotationDraftLine, value: any) => {
    setLines((prev) => {
      const updated = [...prev];
      const numVal = parseFloat(value) || 0;
      updated[index] = {
        ...updated[index],
        [field]: field === 'unitPrice' || field === 'quantity' || field === 'discountPercentage' || field === 'gstPercentage'
          ? Math.max(0, numVal)
          : value,
      };
      return updated;
    });
  };

  // Math calculation preview
  let calcBaseTotal = 0;
  let calcDiscountTotal = 0;
  let calcGstTotal = 0;
  let calcGrandTotal = 0;

  lines.forEach((line) => {
    const lineBase = line.quantity * line.unitPrice;
    const lineDisc = lineBase * (line.discountPercentage / 100);
    const taxable = lineBase - lineDisc;
    const lineGst = taxable * (line.gstPercentage / 100);
    const lineTot = taxable + lineGst;

    calcBaseTotal += lineBase;
    calcDiscountTotal += lineDisc;
    calcGstTotal += lineGst;
    calcGrandTotal += lineTot;
  });

  const selectedEnquiry = enquiries.find((e) => e.id === selectedEnquiryId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      if (!selectedEnquiryId) throw new Error('Please select an enquiry.');
      if (lines.length === 0) throw new Error('Quotation must contain at least one line item.');

      mockErp.createQuotation({
        enquiryId: selectedEnquiryId,
        validUntil,
        items: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discountPercentage: l.discountPercentage,
          gstPercentage: l.gstPercentage,
        })),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create quotation');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Generate Commercial Quotation</h3>
              <p className="text-xs text-slate-500">Calculate base amounts, discount %, and 18% GST per line item</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Top Selection Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Customer Enquiry Reference *
              </label>
              <select
                value={selectedEnquiryId}
                onChange={(e) => setSelectedEnquiryId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {enquiries.map((enq) => (
                  <option key={enq.id} value={enq.id}>
                    {enq.enquiryNumber} — {enq.customer?.companyName} ({enq.items.length} items) [Status: {enq.status}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valid Until *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {selectedEnquiry && (
              <div className="sm:col-span-3 text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 flex flex-wrap justify-between gap-2">
                <span>Customer: <strong className="text-slate-800">{selectedEnquiry.customer?.companyName}</strong> ({selectedEnquiry.customer?.contactPerson})</span>
                <span>Enquiry Date: <strong className="text-slate-800">{selectedEnquiry.enquiryDate}</strong></span>
                <span>Required Date: <strong className="text-blue-700">{selectedEnquiry.requiredDate}</strong></span>
              </div>
            )}
          </div>

          {/* Line Items Pricing Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-blue-600" />
                Line Item Commercial Pricing & Tax Calculations
              </h4>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                All math strictly calculated & verified by backend engine
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2.5">Product</th>
                    <th className="px-3 py-2.5 text-center w-20">Qty</th>
                    <th className="px-3 py-2.5 text-right w-28">Unit Price (₹)</th>
                    <th className="px-3 py-2.5 text-center w-24">Discount %</th>
                    <th className="px-3 py-2.5 text-center w-20">GST %</th>
                    <th className="px-3 py-2.5 text-right w-32">Line Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {lines.map((line, idx) => {
                    const lineBase = line.quantity * line.unitPrice;
                    const lineDisc = lineBase * (line.discountPercentage / 100);
                    const taxable = lineBase - lineDisc;
                    const lineGst = taxable * (line.gstPercentage / 100);
                    const lineTotal = taxable + lineGst;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2.5">
                          <div className="font-mono font-bold text-blue-700">{line.productCode}</div>
                          <div className="text-slate-800 font-medium line-clamp-1">{line.productName}</div>
                        </td>

                        <td className="px-3 py-2.5 text-center">
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                            className="w-16 px-2 py-1 border border-slate-300 rounded text-center font-bold text-slate-800 bg-white"
                          />
                        </td>

                        <td className="px-3 py-2.5 text-right">
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={line.unitPrice}
                            onChange={(e) => handleLineChange(idx, 'unitPrice', e.target.value)}
                            className="w-24 px-2 py-1 border border-slate-300 rounded text-right font-medium text-slate-800 bg-white"
                          />
                        </td>

                        <td className="px-3 py-2.5 text-center">
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={line.discountPercentage}
                              onChange={(e) => handleLineChange(idx, 'discountPercentage', e.target.value)}
                              className="w-14 px-1.5 py-1 border border-slate-300 rounded text-center text-slate-800 bg-white"
                            />
                            <Percent className="w-3 h-3 text-slate-400" />
                          </div>
                        </td>

                        <td className="px-3 py-2.5 text-center">
                          <input
                            type="number"
                            min="0"
                            value={line.gstPercentage}
                            onChange={(e) => handleLineChange(idx, 'gstPercentage', e.target.value)}
                            className="w-12 px-1 py-1 border border-slate-300 rounded text-center text-slate-800 bg-white"
                          />
                        </td>

                        <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                          ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grand Totals Summary Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs text-slate-500 space-y-1">
              <div>• Initial Status: <span className="font-bold text-slate-700">DRAFT</span></div>
              <div>• Lifecycle: DRAFT ➔ SENT ➔ ACCEPTED / REJECTED ➔ Sales Order</div>
            </div>

            <div className="w-full sm:w-72 space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-slate-600">
                <span>Total Base Amount:</span>
                <span className="font-mono font-medium">₹{calcBaseTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Commercial Discount:</span>
                <span className="font-mono font-medium text-red-600">-₹{calcDiscountTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total GST (18%):</span>
                <span className="font-mono font-medium text-emerald-600">+₹{calcGstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="font-mono text-blue-700 text-base">₹{calcGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-2"
            >
              <Layers className="w-4 h-4" />
              <span>Save & Generate Quotation (DRAFT)</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
