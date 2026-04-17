import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

async function bootstrap() {
  if (import.meta.env.DEV && 'serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    } catch {
      // Ignore cleanup failures so the app still boots.
    }
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
}

bootstrap();
