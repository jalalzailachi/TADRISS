import { LoginForm } from '@/components/auth/LoginForm';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { getLocale, getMessages } from 'next-intl/server';
import Link from 'next/link';

export default async function LoginPage() {
  const locale = await getLocale();
  const messages = await getMessages();
  const t = messages.auth as unknown as Record<string, string>;

  return (
    <AuthLayout
      title={t.loginTitle}
      subtitle={t.loginSubtitle}
      locale={locale}
      type="login"
    >
      <LoginForm />
      
      <div className="mt-8 pt-6 border-t border-surface-container-high flex flex-col items-center gap-4 text-center">
        <p className="text-on-surface-variant text-sm">
          {t.noAccount}
        </p>
        <Link 
          href="/signup" 
          className="text-primary font-bold hover:underline transition-all"
        >
          {t.createAccount}
        </Link>
      </div>
    </AuthLayout>
  );
}
