'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, CreditCard, RefreshCw, Loader2, Search, CheckCircle2,
  AlertCircle, DollarSign, Download, ArrowUpRight, RotateCcw, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  user_id: string;
  customer_name?: string;
  customer_phone?: string;
  plan_sku: string;
  gross_amount_npr: number;
  discount_amount_npr: number;
  net_amount_npr: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
}

export default function AdminOrdersClient() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Action states
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [actionType, setActionType] = useState<'verify' | 'refund' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?status=${statusFilter}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load orders');
      setOrders(data.orders || []);
    } catch (err: any) {
      toast.error(err.message || 'Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleProcessOrder = async () => {
    if (!selectedOrder || !actionType) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          action: actionType,
          notes: actionNotes,
          reason: actionNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${actionType} order`);
      toast.success(data.message || `Order successfully updated!`);
      setSelectedOrder(null);
      setActionType(null);
      setActionNotes('');
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setProcessing(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      o.customer_name?.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q) ||
      o.plan_sku?.toLowerCase().includes(q) ||
      o.customer_phone?.includes(q)
    );
  });

  const exportCsv = () => {
    const headers = ['Order ID', 'Customer', 'Phone', 'Plan SKU', 'Gross NPR', 'Discount NPR', 'Net NPR', 'Status', 'Date'];
    const lines = filteredOrders.map((o) => [
      o.id,
      o.customer_name || '',
      o.customer_phone || '',
      o.plan_sku,
      o.gross_amount_npr,
      o.discount_amount_npr,
      o.net_amount_npr,
      o.status,
      o.created_at,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...lines].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <CreditCard size={22} className="text-primary" /> Orders &amp; Payment Verification Hub
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Inspect customer bank transfers, Fonepay slips, approve enrollments, and process refunds.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              disabled={filteredOrders.length === 0}
              className="btn-secondary py-2 px-3 text-xs font-bold gap-1.5 disabled:opacity-50"
            >
              <Download size={14} /> Export CSV
            </button>
            <button onClick={fetchOrders} className="btn-secondary py-2 px-3 text-xs font-bold gap-1.5">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* Security / Role Notice */}
        <div className="bg-ma-light/30 border border-ma/20 rounded-2xl p-4 flex items-center gap-3">
          <ShieldCheck size={20} className="text-ma shrink-0" />
          <p className="text-xs text-foreground leading-relaxed">
            <strong>Payment Staff Boundary:</strong> Authorized payment personnel can inspect and verify transactions, approve enrollments, and issue audited refunds. They cannot edit course curricula or modify student quiz scores.
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by customer name, order ID, phone, plan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 py-2 text-xs w-full"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field py-2 text-xs"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending Approval</option>
            <option value="completed">Completed / Verified</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl text-muted-foreground">
            <CreditCard size={32} className="mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-sm">No orders found.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border uppercase font-semibold text-muted-foreground tracking-wider">
                <tr>
                  <th className="p-3.5">Order ID &amp; Date</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Plan / SKU</th>
                  <th className="p-3.5">Amount (NPR)</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-foreground">{o.id.slice(0, 13)}...</div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-foreground">{o.customer_name || 'Student'}</div>
                      <div className="text-[11px] text-muted-foreground">{o.customer_phone || '—'}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-foreground capitalize">
                        {o.plan_sku?.replace(/_/g, ' ') || 'Course Pass'}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-foreground">
                      Rs. {Number(o.net_amount_npr || 0).toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        o.status === 'completed'
                          ? 'bg-success-light text-success'
                          : o.status === 'pending'
                          ? 'bg-amber-500/15 text-amber-600'
                          : o.status === 'refunded'
                          ? 'bg-error-light text-error'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {o.status === 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedOrder(o);
                              setActionType('verify');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-success/15 hover:bg-success/25 text-success font-bold text-xs transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 size={13} /> Approve
                          </button>
                        )}
                        {o.status === 'completed' && (
                          <button
                            onClick={() => {
                              setSelectedOrder(o);
                              setActionType('refund');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-error/10 hover:bg-error/20 text-error font-semibold text-xs transition-colors flex items-center gap-1"
                          >
                            <RotateCcw size={13} /> Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Confirmation Modal */}
        {selectedOrder && actionType && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  {actionType === 'verify' ? (
                    <>
                      <CheckCircle2 size={16} className="text-success" /> Approve Payment &amp; Grant Access
                    </>
                  ) : (
                    <>
                      <RotateCcw size={16} className="text-error" /> Process Order Refund
                    </>
                  )}
                </h3>
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setActionType(null);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-muted/50 p-3 rounded-xl space-y-1">
                  <p><span className="text-muted-foreground">Order ID:</span> <strong className="font-mono">{selectedOrder.id}</strong></p>
                  <p><span className="text-muted-foreground">Customer:</span> <strong>{selectedOrder.customer_name}</strong></p>
                  <p><span className="text-muted-foreground">Amount:</span> <strong>Rs. {selectedOrder.net_amount_npr.toLocaleString()}</strong></p>
                  <p><span className="text-muted-foreground">Plan:</span> <strong>{selectedOrder.plan_sku}</strong></p>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    {actionType === 'verify' ? 'Verification Notes / Transaction Ref:' : 'Refund Reason (Audit Logged):'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={actionType === 'verify' ? 'e.g. Fonepay ref #9834289 confirmed' : 'e.g. Accidental double purchase'}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="input-field w-full py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setActionType(null);
                  }}
                  className="btn-secondary py-1.5 px-3 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessOrder}
                  disabled={processing}
                  className={`py-1.5 px-4 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
                    actionType === 'verify'
                      ? 'bg-success hover:bg-success/90 text-white'
                      : 'bg-error hover:bg-error/90 text-white'
                  }`}
                >
                  {processing ? <Loader2 size={13} className="animate-spin" /> : null}
                  {actionType === 'verify' ? 'Confirm & Grant' : 'Confirm Refund'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
