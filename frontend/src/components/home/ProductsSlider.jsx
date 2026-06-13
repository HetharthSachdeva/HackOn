import React, { useRef } from 'react';
import { Link, useRouteLoaderData } from 'react-router-dom';
import './scrollbar.css';

const ProductsSlider = () => {
  const data = useRouteLoaderData("root");
  const productsData = data.data.products;

  const sliderRef = useRef(null);

  const handleScroll = (direction) => {
    if (!sliderRef.current) return;
    const amount = 600;
    sliderRef.current.scrollLeft += direction === 'left' ? -amount : amount;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-2 mb-12">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        {/* Header */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
              Today's deals
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-600">HOT</span>
            </h2>
            <p className="mt-1 text-sm text-gray-500">Hand-picked offers, refreshed daily</p>
          </div>
          <Link
            to="/allProducts"
            className="text-sm font-semibold text-violet-600 hover:text-violet-700 whitespace-nowrap"
          >
            Shop all deals →
          </Link>
        </div>

        {/* Slider */}
        <div className="group relative">
          <div
            ref={sliderRef}
            className="flex gap-4 overflow-x-hidden scroll-smooth custom-scrollbar group-hover:overflow-x-auto pb-2"
          >
            {productsData.map((product, index) => {
              const hasDiscount = product.discountPercentage > 0;
              const finalPrice = hasDiscount
                ? product.price * (1 - product.discountPercentage / 100)
                : product.price;
              return (
                <Link
                  key={index}
                  to={`/allProducts/${product.title}`}
                  className="group/card flex-shrink-0 w-44 rounded-2xl border border-gray-100 bg-white p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-violet-200"
                >
                  <div className="relative h-36 w-full overflow-hidden rounded-xl bg-gray-50">
                    {hasDiscount && (
                      <span className="absolute left-2 top-2 z-10 rounded-full bg-violet-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        {product.discountPercentage.toFixed(0)}% OFF
                      </span>
                    )}
                    <img
                      className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover/card:scale-110"
                      src={product.thumbnail}
                      alt={product.title}
                    />
                  </div>
                  <div className="mt-3">
                    <p className="line-clamp-2 min-h-[40px] text-sm font-semibold text-gray-800 group-hover/card:text-violet-600">
                      {product.title}
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-lg font-black text-gray-900">₹{finalPrice.toFixed(0)}</span>
                      {hasDiscount && (
                        <span className="text-xs text-gray-400 line-through">₹{product.price.toFixed(0)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Scroll buttons */}
          <button
            onClick={() => handleScroll('left')}
            className="absolute -left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white text-gray-700 shadow-lg ring-1 ring-gray-100 transition hover:bg-gray-50 group-hover:grid"
            aria-label="Scroll left"
          >
            ‹
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="absolute -right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white text-gray-700 shadow-lg ring-1 ring-gray-100 transition hover:bg-gray-50 group-hover:grid"
            aria-label="Scroll right"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductsSlider;

