import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function useBotpressLoader() {
  const location = useLocation();

  useEffect(() => {
    // hanya jalankan di halaman login & register
    const allowedPaths = ['/login', '/register'];

    if (!allowedPaths.includes(location.pathname)) {
      // Jika bukan di halaman login/register: hapus chatbot
      const script = document.getElementById('botpress-webchat-script');
      if (script) script.remove();

      if (window.botpress) {
        try { window.botpress.close(); } catch {}
        try { window.botpress.destroy(); } catch {}
        delete window.botpress;
      }

      const fab = document.querySelector('.bpFab');
      if (fab) fab.remove();
      return;
    }

    // Inject script jika belum ada
    const injectScript = () => {
      return new Promise((resolve, reject) => {
        if (window.botpress) return resolve();

        const existing = document.getElementById('botpress-webchat-script');
        if (existing) {
          existing.onload = resolve;
          existing.onerror = reject;
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.botpress.cloud/webchat/v3.3/inject.js';
        script.async = true;
        script.id = 'botpress-webchat-script';
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const initBotpress = async () => {
      if (!window.botpress) return;

      await window.botpress.init({
        botId: 'af2b4fff-fd14-404d-8184-543b5bc9349b',
        clientId: '471604bd-75df-43c1-80b9-908e3cdf7338',
        configuration: {
        version: 'v1',
        botName: 'SAKTI Assistant',
        botAvatar: 'https://files.bpcontent.cloud/2025/07/27/09/20250727093652-HSRR0UDX.png',
        website: {
          title: 'https://www.sucofindo.co.id/',
          link: 'https://www.sucofindo.co.id/'
        },
        email: {
          title: 'customer.service@sucofindo.co.id',
          link: 'customer.service@sucofindo.co.id'
        },
        phone: {
          title: '+62217983666',
          link: '+62217983666'
        },
        termsOfService: {},
        privacyPolicy: {},
        color: '#000476',
        variant: 'solid',
        headerVariant: 'solid',
        themeMode: 'dark',
        fontFamily: 'inter',
        radius: 4,
        feedbackEnabled: false,
        footer: ''
        },
      });
    };

    injectScript().then(initBotpress).catch(console.error);

    // Cleanup kalau ganti route
    return () => {
      if (!allowedPaths.includes(location.pathname)) {
        try { window.botpress?.close?.(); } catch {}
        try { window.botpress?.destroy?.(); } catch {}
      }
    };
  }, [location.pathname]);
}
