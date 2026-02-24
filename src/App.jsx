import { useState } from 'react';
import HomePage from './Home';
import ClientCrush from './ClientCrush';

export default function App() {
  const [page, setPage] = useState('home');

  if (page === 'clientcrush') {
    return <ClientCrush onBack={() => setPage('home')} />;
  }

  return <HomePage onNavigate={setPage} />;
}
