// _app.tsx
import { AppProps } from 'next/app';
import { TranslationProvider } from 'language-client';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <TranslationProvider
      options={{
        apiUrl: process.env.NEXT_PUBLIC_LANGUAGE_API_URL || 'http://localhost:3100/api/v1',
        projectId: process.env.NEXT_PUBLIC_LANGUAGE_PROJECT_ID || '9a277564-bd72-422c-b550-132656ca4768',
        defaultLocale: 'zh-CN',
        defaultNamespace: 'common',
      }}
      initialNamespaces={['common', 'home']}
    >
      <Component {...pageProps} />
    </TranslationProvider>
  );
}

export default MyApp;

// components/LanguageSwitcher.tsx
import { useLocale } from 'language-client';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="language-switcher">
      <button
        className={locale === 'zh-CN' ? 'active' : ''}
        onClick={() => setLocale('zh-CN')}
      >
        中文
      </button>
      <button
        className={locale === 'en' ? 'active' : ''}
        onClick={() => setLocale('en')}
      >
        English
      </button>
    </div>
  );
}

// pages/index.tsx
import { useTranslation } from 'language-client';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function Home() {
  const { t } = useTranslation('home');

  return (
    <div className="container">
      <header>
        <LanguageSwitcher />
      </header>

      <main>
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>

        <div className="features">
          <h2>{t('features.title')}</h2>
          <ul>
            <li>{t('features.items.0')}</li>
            <li>{t('features.items.1')}</li>
            <li>{t('features.items.2')}</li>
          </ul>
        </div>

        <div className="cta">
          <button>{t('cta.button')}</button>
          <p>{t('cta.description', { price: '$9.99' })}</p>
        </div>
      </main>

      <footer>
        <p>{t('footer.copyright', { year: new Date().getFullYear().toString() })}</p>
      </footer>
    </div>
  );
}
