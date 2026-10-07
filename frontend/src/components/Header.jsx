import React from 'react';

export const Header = ({ title, subtitle }) => {

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div>
        {title && <h2 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h2>}
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </header>
  );
};

export default Header;
