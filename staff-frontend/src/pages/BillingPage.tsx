import React, { useState } from 'react';
import { Receipt, IndianRupee, AlertTriangle, CheckCircle2, RefreshCw, X, CreditCard, Wallet } from 'lucide-react';
import { Header } from '../components/Header';
import { GlassCard, Badge, Button, StatCard, Modal } from '../components/ui';
import { useStore } from '../store/useStore';
import { clsx } from 'clsx';

const DEMO_LEDGER = [
  { id: 'TXN-9920', patient: 'Priya Sharma', pid: '99000001', consult: 500, platform: 20, status: 'success', time: '10:32 AM', method: 'UPI' },
  { id: 'TXN-9919', patient: 'Rahul Mehta', pid: '99000042', consult: 500, platform: 20, status: 'success', time: '09:55 AM', method: 'Cash' },
  { id: 'TXN-9918', patient: 'Sunita Rao', pid: '99000078', consult: 700, platform: 20, status: 'error', time: '09:20 AM', method: 'Card' },
  { id: 'TXN-9917', patient: 'Arvind Joshi', pid: '99000105', consult: 500, platform: 20, status: 'success', time: '08:45 AM', method: 'UPI' },
];

export function BillingPage() {
  const { billingPatientId, closeBilling, addToast } = useStore();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [activeMethod, setActiveMethod] = useState<'upi' | 'cash' | 'card'>('upi');

  const totalCollected = DEMO_LEDGER.filter(t => t.status === 'success').reduce((a, b) => a + b.consult + b.platform, 0);
  const failedCount = DEMO_LEDGER.filter(t => t.status === 'error').length;

  const handleRetry = async (txnId: string) => {
    setRetrying(txnId);
    await new Promise(r => setTimeout(r, 1500));
    addToast('error', `Transaction API error: Payment gateway timeout for ${txnId}`);
    setRetrying(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Billing & Payments"
        subtitle="Alt+B — OPD ledger"
        icon={<Receipt size={16} />}
        actions={
          <Button variant="primary" icon={<IndianRupee size={14} />} onClick={() => setCheckoutOpen(true)}>
            New Checkout
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scroll p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Today's Collections" value={`₹${totalCollected.toLocaleString()}`} icon={<IndianRupee size={18} />} iconBg="bg-green-500/10 text-green-400" monospace />
          <StatCard label="OPD Revenue" value={`₹${(totalCollected - DEMO_LEDGER.filter(t=>t.status==='success').length*20).toLocaleString()}`} icon={<Receipt size={18} />} iconBg="bg-blue-500/10 text-blue-400" monospace />
          <StatCard label="Platform Fees" value={`₹${DEMO_LEDGER.filter(t=>t.status==='success').length * 20}`} icon={<Wallet size={18} />} iconBg="bg-purple-500/10 text-purple-400" monospace />
          <StatCard label="Failed Transactions" value={failedCount} icon={<AlertTriangle size={18} />} iconBg="bg-red-500/10 text-red-400" />
        </div>

        {/* Ledger Table */}
        <GlassCard className="overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="font-bold text-primary text-sm">Transaction Ledger</h3>
            <Badge variant="gray">{DEMO_LEDGER.length} transactions today</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['TXN ID', 'Patient', 'Consult Fee', 'Platform', 'Total', 'Method', 'Status', 'Time', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEMO_LEDGER.map(txn => (
                  <tr key={txn.id} className={clsx('audit-row', txn.status === 'error' && 'bg-red-500/[0.03]')}>
                    <td className="px-4 py-3 font-mono text-xs text-green-400">{txn.id}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-primary">{txn.patient}</p>
                      <p className="text-[10px] font-mono text-muted">{txn.pid}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-primary">₹{txn.consult.toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono text-sm text-secondary">₹{txn.platform.toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono text-sm font-bold text-primary">₹{(txn.consult + txn.platform).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="gray">{txn.method}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {txn.status === 'success'
                        ? <Badge variant="green"><CheckCircle2 size={9} className="inline" /> Paid</Badge>
                        : <Badge variant="red"><AlertTriangle size={9} className="inline" /> Failed</Badge>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{txn.time}</td>
                    <td className="px-4 py-3">
                      {txn.status === 'error' && (
                        <Button
                          variant="danger"
                          size="sm"
                          loading={retrying === txn.id}
                          icon={<RefreshCw size={11} />}
                          onClick={() => handleRetry(txn.id)}
                        >
                          Retry
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      {/* Checkout Modal */}
      <Modal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        title="Patient Checkout"
        subtitle="Collect OPD payment"
        icon={<IndianRupee size={16} />}
        width="max-w-md"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1 justify-center" onClick={() => setCheckoutOpen(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1 justify-center" icon={<CheckCircle2 size={15} />} onClick={() => { addToast('success', 'Payment collected successfully.'); setCheckoutOpen(false); }}>
              Collect Payment
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-xs text-muted mb-1">Patient</p>
            <p className="font-bold text-primary">Priya Sharma</p>
            <p className="text-xs font-mono text-muted">99000001</p>
          </div>

          <div className="space-y-2">
            <FeeRow label="Consultation Fee" value="₹500.00" />
            <FeeRow label="Platform Fee" value="₹20.00" muted />
            <div className="pt-2 border-t border-white/[0.08]">
              <FeeRow label="Total" value="₹520.00" bold />
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {(['upi', 'cash', 'card'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setActiveMethod(m)}
                  className={clsx(
                    'py-2.5 rounded-xl text-xs font-bold border transition-all uppercase',
                    activeMethod === m ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-white/[0.03] border-white/[0.08] text-muted hover:border-white/20'
                  )}
                >
                  {m === 'upi' ? 'UPI' : m === 'cash' ? 'Cash' : 'Card'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function FeeRow({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={clsx('text-sm', muted ? 'text-muted' : 'text-secondary')}>{label}</span>
      <span className={clsx('font-mono text-sm', bold ? 'font-black text-primary text-base' : muted ? 'text-muted' : 'text-primary')}>{value}</span>
    </div>
  );
}
