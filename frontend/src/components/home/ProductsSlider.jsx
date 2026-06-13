import React, { useRef } from 'react';
import { Link, useRouteLoaderData } from 'react-router-dom';
import './scrollbar.css';

const ProductsSlider = () => {
  const data = useRouteLoaderData("root");
  const productsData = data.data.products;
  const sliderRef = useRef(null);

  const handleScroll = (direction) => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollLeft += direction === 'left' ? -600 : 600;
  };

  return (
    <div className="mx-auto mb-12 mt-2 max-w-[1400px] px-4 sm:px-6">
      <div className="rounded-3xl bg-[#151c2b] p-6 ring-1 ring-white/5">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
              Today's deals
              <span className="rounded-full bg-lime-400/15 px-2.5 py-0.5 text-xs font-bold text-lime-300">HOT</span>
            </h2>
            <p className="mt-1 text-sm text-gray-500">Hand-picked offers, refreshed daily</p>
          </div>
          <Link to="/allProducts" className="whitespace-nowrap text-sm font-semibold text-lime-400 hover:text-lime-300">
            Shop all deals →
          </Link>
        </div>

        <div className="group relative">
          <div ref={sliderRef} className="flex gap-4 overflow-x-hidden scroll-smooth pb-2 group-hover:overflow-x-auto custom-scrollbar">
            {productsData.map((product, index) => {
              const hasDiscount = product.discountPercentage > 0;
              const finalPrice = hasDiscount ? product.price * (1 - product.discountPercentage / 100) : product.price;
              return (
                <Link
                  key={index}
                  to={`/allProducts/${product.title}`}
                  className="group/card w-44 flex-shrink-0 rounded-2xl bg-[#0e1420] p-3 ring-1 ring-white/5 transition-all duration-300 hover:-translate-y-1 hover:ring-lime-400/40"
                >
                  <div className="relative h-36 w-full overflow-hidden rounded-xl bg-[#0b1120]">
                    {hasDiscount && (
                      <span className="absolute left-2 top-2 z-10 rounded-full bg-lime-400 px-2 py-0.5 text-[10px] font-bold text-black">
                        {product.discountPercentage.toFixed(0)}% OFF
                      </span>
                    )}
                    <img className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover/card:scale-110" src={product.thumbnail} alt={product.title} />
                  </div>
                  <div className="mt-3">
                    <p className="line-clamp-2 min-h-[40px] text-sm font-semibold text-white group-hover/card:text-lime-300">{product.title}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-lg font-black text-white">${finalPrice.toFixed(0)}</span>
                      {hasDiscount && <span className="text-xs text-gray-500 line-through">${product.price.toFixed(0)}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <button onClick={() => handleScroll('left')} className="absolute -left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-[#151c2b] text-white shadow-lg ring-1 ring-white/10 transition hover:bg-[#1c2638] group-hover:grid" aria-label="Scroll left">‹</button>
          <button onClick={() => handleScroll('right')} className="absolute -right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-[#151c2b] text-white shadow-lg ring-1 ring-white/10 transition hover:bg-[#1c2638] group-hover:grid" aria-label="Scroll right">›</button>
        </div>
      </div>
    </div>
  );
};

export default ProductsSlider;
