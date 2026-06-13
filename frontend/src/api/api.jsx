import axios from "axios";

export async function productsData() {
    try {
        const response = await axios.get("http://localhost:8000/api/v1/catalog/products?limit=1000");
        // FastAPI returns paginated Page model: { items: [...], total: X, limit: Y, offset: Z }
        const qcommerceProducts = response.data.items || [];

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
    } catch (error) {
        console.error("Error fetching products from Backend:", error);
        return { data: { products: [] } };
    }
};
