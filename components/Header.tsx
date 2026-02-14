import React from 'react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  return (
    <header className="h-16 flex items-center px-6 border-b border-border-dark bg-card-dark shrink-0 lg:hidden">
      <button
        onClick={onToggleSidebar}
        className="text-text-secondary hover:text-white transition-colors p-2 -ml-2"
      >
        <span className="material-symbols-outlined text-2xl">menu</span>
      </button>
      <span className="font-bold text-xl text-white ml-4">SOCIALPRIME</span>
    </header>
  );
};

export default Header;