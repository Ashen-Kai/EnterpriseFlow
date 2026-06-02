import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const pageTitles = {
  '/': 'Dashboard',
  '/inventory': 'Inventory Management',
  '/procurement': 'Procurement',
  '/hr': 'Human Resources',
  '/reports': 'Reports & Analytics',
};

export default function Layout() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'EnterpriseFlow';

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <header className="header">
          <h1 className="header-title">{title}</h1>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
