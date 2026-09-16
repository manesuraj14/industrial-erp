import React, { useState } from 'react';
import type { SalesOrder } from '../types/erp';
import { X, Truck, User, Hash, Calendar, AlertCircle } from 'lucide-react';

interface DispatchModalProps {
  order: SalesOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDispatch: (orderId: string, dispatchData: { vehicleNumber: string; driverName: string }) => void;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmDispatch,
}) => {
  const [vehicleNumber, setVehicleNumber] = useState('MH-12-AB-9876');
  const [driverName, setDriverName] = useState('Ramesh Patil');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!vehicleNumber.trim() || !driverName.trim()) {
      setErrorMsg('Please provide both vehicle registration number and driver name.');
      return;
    }

    try {
      onConfirmDispatch(order.id, {
        vehicleNumber: vehicleNumber.trim(),
        driverName: driverName.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Dispatch processing failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 rounded-lg text-white">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Process Order Dispatch</h3>
              <p className="text-xs text-slate-500">
                Log logistics and execute dual stock decrement (Physical & Reserved)
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

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Order Reference Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Sales Order Reference:</span>
              <span className="font-mono font-bold text-blue-700">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Customer:</span>
              <span className="font-bold text-slate-800">{order.customer?.companyName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Order Value:</span>
              <span className="font-mono font-bold text-slate-900">₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Items to Dispatch */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Goods Scheduled for Shipment ({order.items.length})
            </h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-right">Dispatch Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">
                        <span className="font-mono font-bold text-blue-700 mr-1.5">{it.productCode}</span>
                        <span className="text-slate-800">{it.productName}</span>
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900">
                        {it.quantity} {it.unit || 'PCS'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Logistics Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vehicle Registration Number *
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="e.g. MH-12-AB-9876"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Driver Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="e.g. Ramesh Patil"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Stock Deduction Explanation Notice */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Stock Impact on Dispatch:
            </div>
            <div>• Physical Quantity will decrement by item quantities.</div>
            <div>• Reserved Quantity will release (decrement) by item quantities.</div>
            <div>• Available Quantity (Physical − Reserved) remains balanced!</div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Truck className="w-4 h-4" />
              <span>Confirm & Ship Goods</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
