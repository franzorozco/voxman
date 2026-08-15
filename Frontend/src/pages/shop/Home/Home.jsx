import React from 'react';

const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <div className="relative bg-gray-900 h-[600px] flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          {/* Placeholder for Hero Image */}
          <div className="w-full h-full bg-gray-800 opacity-50"></div>
        </div>
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Nueva Colección
          </h1>
          <p className="mt-4 text-xl text-gray-300 max-w-3xl mx-auto">
            Descubre las últimas tendencias en moda urbana y casual. 
            Calidad premium diseñada para tu estilo de vida.
          </p>
          <div className="mt-10">
            <a href="/shop/catalog" className="inline-block bg-white border border-transparent py-3 px-8 text-base font-medium text-gray-900 hover:bg-gray-100 transition-colors">
              Comprar Ahora
            </a>
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">Destacados</h2>
        <div className="mt-6 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
            {/* Product Card Placeholder */}
            <div className="group relative">
                <div className="w-full min-h-80 bg-gray-200 aspect-w-1 aspect-h-1 rounded-md overflow-hidden group-hover:opacity-75 lg:h-80 lg:aspect-none">
                    {/* Image Placeholder */}
                </div>
                <div className="mt-4 flex justify-between">
                    <div>
                        <h3 className="text-sm text-gray-700">
                            <a href="/shop/product/1">
                                <span aria-hidden="true" className="absolute inset-0"></span>
                                Camiseta Premium
                            </a>
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">Negro</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">$35.00</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
