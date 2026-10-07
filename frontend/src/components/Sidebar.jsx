import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  ListOrdered,
  Award,
} from 'lucide-react';

export const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Create Job', href: '/create-job', icon: PlusCircle },
    { label: 'Jobs', href: '/jobs', icon: ListOrdered },
    { label: 'Certificates', href: '/certificates', icon: Award },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-screen text-slate-700 z-50 select-none shadow-sm">
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex-shrink-0">
          <Link to="/dashboard" className="block group">
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
              Cert<span className="text-[#ed458b]">Forge</span>
            </h1>
            <p className="text-[11px] font-semibold text-slate-400 mt-1.5 tracking-wider uppercase">
              Bulk Credential Engine
            </p>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1.5 flex-1">
          <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>
          {navItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? location.pathname === '/' || location.pathname === '/dashboard'
                : location.pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#ed458b] text-white shadow-sm shadow-[#ed458b]/30'
                    : 'text-slate-600 hover:bg-[#f3b6cf]/20 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
