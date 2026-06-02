import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users, FileBarChart,
  LogOut, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, path: '/' },
  { section: 'Modules' },
  { label: 'Inventory', icon: Package, path: '/inventory' },
  { label: 'Procurement', icon: ShoppingCart, path: '/procurement' },
  { label: 'HR', icon: Users, path: '/hr' },
  { section: 'Analytics' },
  { label: 'Reports', icon: FileBarChart, path: '/reports' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">EnterpriseFlow</div>
        <div className="sidebar-subtitle">ERP System</div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, i) => {
          if (item.section) {
            return (
              <div key={i} className="sidebar-section-label">
                {item.section}
              </div>
            );
          }
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              end={item.path === '/'}
            >
              <Icon />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{user?.role?.toLowerCase()}</div>
          </div>
          <button
            className="btn-icon"
            onClick={logout}
            title="Logout"
            style={{ marginLeft: 'auto' }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
