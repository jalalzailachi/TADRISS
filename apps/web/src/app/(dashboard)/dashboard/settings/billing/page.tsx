import { getSubscription, checkStudentLimit } from '@/lib/subscription';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function BillingPage() {
  const sub = await getSubscription();
  const usage = await checkStudentLimit();
  
  const stats = [
    { label: 'Current Plan', value: sub?.tier?.toUpperCase() || 'NONE', icon: 'stars' },
    { label: 'Student Limit', value: `${usage.current || 0} / ${sub?.max_students || 0}`, icon: 'groups' },
    { label: 'Status', value: sub?.status?.toUpperCase() || 'UNKNOWN', icon: 'check_circle' },
  ];

  return (
    <div className="space-y-10 pb-12 anim-in">
      <PageHeader 
        title="BILLING & SUBSCRIPTION" 
        subtitle="MANAGE YOUR INSTITUTIONAL QUOTAS AND FINANCIAL PROTOCOLS" 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10 shadow-sm group hover:scale-[1.02] transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">{s.icon}</span>
              </div>
              <span className="text-[10px] font-black text-outline uppercase tracking-widest leading-none">{s.label}</span>
            </div>
            <div className="text-3xl font-black text-on-surface uppercase tracking-tighter italic">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-outline-variant/10">
           <h3 className="text-xl font-black text-on-surface uppercase tracking-tight">Active Plan Details</h3>
           <p className="text-xs text-outline font-bold uppercase tracking-widest mt-1">Operational limits and billing cycle information</p>
        </div>
        <div className="p-8 space-y-8">
           <div className="flex justify-between items-center py-4 border-b border-outline-variant/5">
              <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wide">Next Billing Date</span>
              <span className="text-sm font-black text-on-surface uppercase italic">
                {sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'N/A'}
              </span>
           </div>
           <div className="flex justify-between items-center py-4 border-b border-outline-variant/5">
              <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wide">Usage Ratio</span>
              <div className="flex items-center gap-4">
                 <div className="w-48 h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${Math.min(((usage.current || 0) / (sub?.max_students || 1)) * 100, 100)}%` }}
                    />
                 </div>
                 <span className="text-xs font-black text-on-surface uppercase italic">
                   {Math.round(((usage.current || 0) / (sub?.max_students || 1)) * 100)}%
                 </span>
              </div>
           </div>
        </div>
        <div className="p-8 bg-surface-container-low flex justify-end gap-4">
           <button className="h-12 px-8 bg-on-surface text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-on-surface/10">
             Upgrade Plan →
           </button>
        </div>
      </div>
    </div>
  );
}
