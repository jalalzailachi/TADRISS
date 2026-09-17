import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

type Messages = Record<string, unknown>;

const messages: Record<string, () => Promise<{ default: Messages }>> = {
  en: () => import('../messages/en.json'),
  fr: () => import('../messages/fr.json'),
  ar: () => import('../messages/ar.json'),
};

const fallbackMessages: Record<string, Messages> = {
  en: {
    auth: {
      loginTitle: "Welcome back",
      loginSubtitle: "Access your institution dashboard",
      email: "Work Email",
      password: "Secure Key",
      rememberMe: "Remember this device",
      forgotPassword: "Forgot key?",
      signIn: "Access Dashboard",
      noAccount: "Don't have an account?",
      createAccount: "Create your institution"
    }
  },
  fr: {
    auth: {
      loginTitle: "Bon retour",
      loginSubtitle: "Accédez à votre tableau de bord",
      email: "Email professionnel",
      password: "Clé sécurisée",
      rememberMe: "Se souvenir de moi",
      forgotPassword: "Clé oubliée ?",
      signIn: "Accéder au tableau de bord",
      noAccount: "Pas encore de compte ?",
      createAccount: "Créez votre établissement"
    }
  }
};

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'fr';

  const loadMessages = messages[locale] || messages.fr;
  let moduleMessages: Messages = {};

  try {
    const mod = await loadMessages();
    moduleMessages = mod.default;
  } catch (e) {
    console.error(`Failed to load messages for ${locale}`, e);
  }

  return {
    locale,
    messages: {
      ...fallbackMessages[locale] || fallbackMessages.fr,
      ...moduleMessages
    }
  };
});
