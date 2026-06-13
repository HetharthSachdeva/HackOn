import { supabase } from "./supabaseClient";

export async function productsData() {
    const { data: qcommerceProducts, error } = await supabase
        .from("qcommerce_products")
        .select("*");

    if (error) {
        console.error("Error fetching products from Supabase:", error);
        return { data: { products: [] } };
    }

    const products = qcommerceProducts.map((p) => ({
        id: p.asin,
        title: p.title,
        category: p.category,
        price: p.price,
        thumbnail: p.img_url,
        images: p.img_url ? [p.img_url] : [], // wrap in array for components like ProductDetails/Sliders
        rating: p.stars || 0.0,
        brand: p.unit_size || "Q-Commerce",
        description: `Category: ${p.category}. Tags: ${p.tags}. Delivery in ${p.delivery_time_mins} mins.`,
        stock: p.stock_qty || 0,
        discountPercentage: 10, // dummy discount so deal UI badges display correctly
    }));

    return { data: { products } };
};
