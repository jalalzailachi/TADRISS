import { SignupForm } from '@/components/auth/SignupForm';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { getLocale, getMessages } from 'next-intl/server';
import Link from 'next/link';

export default async function SignupPage() {
  const locale = await getLocale();
  const messages = await getMessages();
  const t = messages.auth as unknown as Record<string, string>;

  return (
    <AuthLayout
      title={t.signupTitle || "Join Tadriss"}
      subtitle={t.signupSubtitle || "Register your institution in seconds"}
      locale={locale}
      type="signup"
    >
      <SignupForm />
      
      <div className="mt-8 pt-6 border-t border-surface-container-high flex flex-col items-center gap-4 text-center">
        <p className="text-on-surface-variant text-sm">
          {t.hasAccount || "Already have an account?"}
        </p>
        <Link 
          href="/login" 
          className="text-primary font-bold hover:underline transition-all"
        >
          {t.loginAction || "Sign in here"}
        </Link>
      </div>
    </AuthLayout>
  );
}
