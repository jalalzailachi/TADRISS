import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ToastProvider } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen overflow-hidden text-slate-900 bg-white">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
