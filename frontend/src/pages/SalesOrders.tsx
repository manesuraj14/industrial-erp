import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockErp } from '../services/mockErpService';
import type { SalesOrder, SalesOrderStatus } from '../types/erp';
import { DispatchModal } from '../components/DispatchModal';
import {
  ShoppingCart,
  Search,
  Building2,
  Calendar,
  CheckCircle2,
  Truck,
  AlertCircle,
  Clock,
  CheckCheck,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface SalesOrdersPageProps {
  onStockUpdated?: () => void;
}

export const SalesOrders: React.FC<SalesOrdersPageProps> = ({ onStockUpdated }) => {
  const { user, isAdmin } = useAuth();
  const [orders, setOrders] = useState<SalesOrder[]>(() => mockErp.getSalesOrders());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | SalesOrderStatus>('ALL');

  // Expanded row tracking
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Dispatch modal
  const [dispatchOrder, setDispatchOrder] = useState<SalesOrder | null>(null);

  // Notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const refreshOrders = () => {
    setOrders(mockErp.getSalesOrders());
    if (onStockUpdated) onStockUpdated();
  };

  const handleConfirmOrder = (orderId: string) => {
    try {
      if (!user) throw new Error('Unauthenticated');
      mockErp.confirmSalesOrder(orderId, user.role);
      refreshOrders();
      setFeedback({
        type: 'success',
        text: 'Sales Order confirmed! Inventory reserved successfully (Physical quantity preserved, Reserved increased).',
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Confirmation failed',
      });
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  const handleConfirmDispatch = (
    orderId: string,
    dispatchData: { vehicleNumber: string; driverName: string }
  ) => {
    try {
      if (!user) throw new Error('Unauthenticated');
      const dsp = mockErp.processDispatch(orderId, dispatchData, user.role);
      refreshOrders();
      setFeedback({
        type: 'success',
        text: `Goods dispatched under ${dsp.dispatchNumber} (Vehicle: ${dsp.vehicleNumber}). Physical & Reserved stock decremented!`,
      });
      setTimeout(() => setFeedback(null), 6000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Dispatch processing failed',
      });
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  const filtered = orders.filter((o) => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(query) ||
      (o.quotationNumber || '').toLowerCase().includes(query) ||
      (o.customer?.companyName || '').toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: SalesOrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DISPATCHED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // Metrics
  const countTotal = orders.length;
  const countPending = orders.filter((o) => o.status === 'PENDING').length;
  const countConfirmed = orders.filter((o) => o.status === 'CONFIRMED').length;
  const countDispatched = orders.filter((o) => o.status === 'DISPATCHED').length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            Sales Orders & Stock Reservation (Screen 4)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track converted orders, execute ACID inventory reservations, and manage vehicle dispatches
          </p>
        </div>

        {/* Current Role Banner */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold">
          <span className="text-slate-500">Active Role:</span>
          <span className={`px-2 py-0.5 rounded font-bold uppercase ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {user?.role}
          </span>
          {!isAdmin && (
            <span className="text-[11px] text-slate-400 italic">
              (Order confirmation & dispatch restricted to Admin)
            </span>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 shadow-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Orders</div>
            <div className="text-xl font-extrabold text-slate-800 mt-0.5">{countTotal}</div>
          </div>
          <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-600 font-medium">Pending Reservation</div>
            <div className="text-xl font-extrabold text-amber-700 mt-0.5">{countPending}</div>
          </div>
          <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-blue-600 font-medium">Stock Reserved (Confirmed)</div>
            <div className="text-xl font-extrabold text-blue-700 mt-0.5">{countConfirmed}</div>
          </div>
          <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
            <CheckCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-emerald-600 font-medium">Dispatched & Fulfilled</div>
            <div className="text-xl font-extrabold text-emerald-700 mt-0.5">{countDispatched}</div>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
            <Truck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          {(['ALL', 'PENDING', 'CONFIRMED', 'DISPATCHED', 'CANCELLED'] as const).map((st) => (
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
            placeholder="Search order #, quotation #, client..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Quotation Ref</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Order Date</th>
                <th className="px-4 py-3 text-right">Total Amount (₹)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Admin Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No sales orders found matching your criteria. Convert an ACCEPTED quotation to see orders here.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const isExpanded = expandedOrderId === order.id;

                  return (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer"
                            title="Toggle order item breakdown"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>

                        <td className="px-4 py-3 font-mono font-bold text-blue-700">
                          {order.orderNumber}
                        </td>

                        <td className="px-4 py-3 font-mono font-semibold text-slate-600">
                          {order.quotationNumber}
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {order.customer?.companyName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {order.items.length} Product line{order.items.length > 1 ? 's' : ''}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {order.orderDate}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 text-sm">
                          ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(order.status)}`}>
                            {order.status}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* PENDING Order -> Admin Confirms & Reserves Stock */}
                            {order.status === 'PENDING' && (
                              isAdmin ? (
                                <button
                                  onClick={() => handleConfirmOrder(order.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold shadow-2xs hover:shadow transition-all cursor-pointer"
                                  title="Check inventory and reserve stock"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  Confirm & Reserve Stock
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  Awaiting Admin Confirmation
                                </span>
                              )
                            )}

                            {/* CONFIRMED Order -> Admin Dispatches Goods */}
                            {order.status === 'CONFIRMED' && (
                              isAdmin ? (
                                <button
                                  onClick={() => setDispatchOrder(order)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-2xs hover:shadow transition-all cursor-pointer"
                                  title="Dispatch goods with vehicle and driver"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  Process Dispatch
                                </button>
                              ) : (
                                <span className="text-[11px] text-blue-600 font-semibold">
                                  Stock Reserved • Ready for Dispatch
                                </span>
                              )
                            )}

                            {/* DISPATCHED Order */}
                            {order.status === 'DISPATCHED' && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Order Dispatched & Stock Deducted
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Line Item Schedule */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 border-y border-slate-200/80">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
                              <div className="flex justify-between items-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                                <span>Order Item Schedule ({order.items.length} Products)</span>
                                <span className="text-slate-400 font-normal">Quotation: {order.quotationNumber}</span>
                              </div>

                              <table className="min-w-full divide-y divide-slate-100 text-xs">
                                <thead className="bg-slate-50 text-slate-500 font-semibold">
                                  <tr>
                                    <th className="px-3 py-2 text-left">Product Code</th>
                                    <th className="px-3 py-2 text-left">Product Description</th>
                                    <th className="px-3 py-2 text-center">Required Qty</th>
                                    <th className="px-3 py-2 text-right">Unit Price</th>
                                    <th className="px-3 py-2 text-right">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {order.items.map((it, idx) => (
                                    <tr key={idx}>
                                      <td className="px-3 py-2 font-mono font-bold text-blue-700">{it.productCode}</td>
                                      <td className="px-3 py-2 text-slate-800">{it.productName}</td>
                                      <td className="px-3 py-2 text-center font-bold text-slate-900">{it.quantity} {it.unit || 'PCS'}</td>
                                      <td className="px-3 py-2 text-right font-mono">₹{it.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                      <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">₹{it.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispatch Modal */}
      <DispatchModal
        order={dispatchOrder}
        isOpen={!!dispatchOrder}
        onClose={() => setDispatchOrder(null)}
        onConfirmDispatch={handleConfirmDispatch}
      />

    </div>
  );
};
