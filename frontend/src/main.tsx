import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { RestaurantHome } from './components/restaurant/RestaurantHome';
import './index.css';

const ManagementApp = lazy(() => import('./App'));
const isRestaurantHome = window.location.pathname === '/';

if (!isRestaurantHome) {
  document.title = 'Quản lý | Sen Việt Buffet';
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isRestaurantHome ? (
      <RestaurantHome />
    ) : (
      <Suspense fallback={<p role="status" className="p-6 text-slate-700">Đang mở cổng quản lý…</p>}>
        <ManagementApp />
      </Suspense>
    )}
  </React.StrictMode>
);
