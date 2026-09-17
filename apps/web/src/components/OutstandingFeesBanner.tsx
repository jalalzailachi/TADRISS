import { useTranslations, useLocale } from 'next-intl'

export function OutstandingFeesBanner({ fees }: {
  fees: { id: string; amount: number; description: string; due_date: string | null }[]
}) {
  const t = useTranslations('payments')
  const tc = useTranslations('common')
  const locale = useLocale()

  if (!fees || fees.length === 0) return null

  const total = fees.reduce((sum, f) => sum + f.amount, 0)

  return (
    <div className="
      bg-warning-soft border border-warning/30 border-s-[4px] border-s-warning
      rounded-[12px] p-5 mb-6 shadow-sm
      animate-fade-in-up
    ">
      <div className="flex items-start gap-4">
        {/* Left: warning icon in amber circle */}
        <div className="w-[36px] h-[36px] rounded-full bg-warning/20 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-warning text-[20px] material-symbols-outlined">warning</span>
        </div>
        
        {/* Right: Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h3 className="font-bold text-warning text-[14px]">
              {fees.length} {t('title')}
            </h3>
            <span className="text-[14px] font-black text-warning">
              {t('amount')}: {total.toLocaleString()} {tc('currency')}
            </span>
          </div>
          
          <div className="space-y-2">
            {fees.map(fee => {
              const isOverdue = fee.due_date && new Date(fee.due_date) < new Date();
              return (
                <div key={fee.id} className="flex items-center justify-between gap-4 py-1.5 border-b border-warning/10 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`text-[13px] font-medium truncate ${isOverdue ? 'text-danger' : 'text-warning'}`}>
                      {fee.description || t('status')}
                    </span>
                    {isOverdue && (
                      <span className="bg-danger text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                        {t('overdue')}
                      </span>
                    )}
                    {fee.due_date && !isOverdue && (
                      <span className="text-warning/70 text-[11px] font-medium">
                        {t('dueDate')} {new Date(fee.due_date).toLocaleDateString(locale)}
                      </span>
                    )}
                  </div>
                  <span className={`text-[13px] font-bold ${isOverdue ? 'text-danger' : 'text-warning'}`}>
                    {fee.amount.toLocaleString()} {tc('currency')}
                  </span>
                </div>
              );
            })}
          </div>
          
          <p className="text-[12px] text-warning/80 mt-4 font-medium">
             {t('noPayments')}
          </p>
        </div>
      </div>
    </div>
  )
}
