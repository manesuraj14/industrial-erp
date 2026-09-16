import React from 'react';
import type { InventoryItem } from '../types/erp';
import { Boxes, AlertCircle, CheckCircle2 } from 'lucide-react';

interface InventoryBarProps {
  inventory: InventoryItem[];
}

export const InventoryBar: React.FC<InventoryBarProps> = ({ inventory }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-600" />
            Live Warehouse Inventory Availability
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Formula: <span className="font-mono font-semibold text-slate-700">Available = Physical Quantity − Reserved Quantity</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Normal Stock
          </span>
          <span className="flex items-center gap-1 text-slate-600 ml-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Low Stock (&lt; 30)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 pt-4">
        {inventory.map((item) => {
          const isLow = item.availableQuantity < 30;
          return (
            <div
              key={item.id}
              className="bg-slate-50 rounded-lg p-3 border border-slate-200/80 hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                    {item.productCode}
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">
                    {item.category}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-800 line-clamp-2 h-8 leading-snug" title={item.productName}>
                  {item.productName}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Physical:</span>
                  <span className="font-medium text-slate-700">{item.physicalQuantity} {item.unit}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Reserved:</span>
                  <span className="font-medium text-purple-700">{item.reservedQuantity} {item.unit}</span>
                </div>
                <div className="flex justify-between text-xs font-bold pt-1 border-t border-dashed border-slate-200">
                  <span className="text-slate-800">Available:</span>
                  <span className={`flex items-center gap-1 ${isLow ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {isLow ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    {item.availableQuantity} {item.unit}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
