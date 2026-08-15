import React from 'react';
import { Outlet } from 'react-router-dom';

const ShopLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* TODO: Add ShopHeader component */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex-shrink-0 flex items-center">
            <span className="text-2xl font-bold tracking-tight text-gray-900">VOXMAN</span>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="/shop" className="text-gray-500 hover:text-gray-900">Inicio</a>
            <a href="/shop/catalog" className="text-gray-500 hover:text-gray-900">Catálogo</a>
            <a href="/shop/nosotros" className="text-gray-500 hover:text-gray-900">Nosotros</a>
          </nav>
          <div className="flex items-center">
            <a href="/shop/cart" className="text-gray-500 hover:text-gray-900 relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {/* Badge placeholder */}
            </a>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Render nested routes here */}
        <Outlet />
      </main>

      {/* TODO: Add ShopFooter component */}
      <footer className="bg-gray-900 mt-auto">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-base text-gray-400">
            &copy; {new Date().getFullYear()} VOXMAN. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ShopLayout;
