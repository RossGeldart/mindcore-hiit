import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { SoundProvider } from '@/contexts/SoundContext';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <AuthProvider>
      <SoundProvider>
        <App />
      </SoundProvider>
    </AuthProvider>
  </>
);