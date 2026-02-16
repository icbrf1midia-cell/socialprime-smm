import React from 'react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  return (
    <header className="h-16 flex items-center px-6 border-b border-border-dark bg-card-dark shrink-0 lg:hidden justify-between">
      <div className="flex items-center">
        <button
          onClick={onToggleSidebar}
          className="text-text-secondary hover:text-white transition-colors p-2 -ml-2 rounded-lg active:bg-white/5"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>

        {/* LOGO OFICIAL NO MOBILE */}
        <img
          src="/logo.png"
          alt="SocialPrime"
          className="h-8 ml-4 w-auto object-contain"
        />
      </div>

      {/* Espaço reservado para alinhar ou adicionar algo na direita futuramente (ex: avatar) */}
      <div className="w-8"></div>
    </header>
  );
};

export default Header;