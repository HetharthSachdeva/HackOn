import React, { useState } from "react";
import { createBrowserRouter, RouterProvider, Outlet, ScrollRestoration } from "react-router-dom";
import QuickCommerceHeader from "./components/header/QuickCommerceHeader";
import Footer from "./components/footer/Footer";
import Home from "./components/home/Home";
import ErrorPage from "./components/error/ErrorPage";
import SignIn from "./components/logIn/SignIn";
import CreateAccount from "./components/logIn/CreateAccount";
import ForgotPassword from "./components/logIn/ForgotPassword";
import Products from "./components/products/Products";
import ProductDetails from "./components/products/ProductDetails";
import Cart from "./components/cart/cart";
import Orders from "./components/orders/Orders";
import { UserCartProvider } from "./context/userCartContext";
import { UserAddressProvider } from "./context/userAddressContext";
import { UserOrdersProvider } from "./context/userOrderContext";
import Checkout from "./components/checkout/Checkout";
import { productsData } from "./api/api";


// Layout component to combine components for main path("/") of routers which has to be rendered when website opens for the first time 
const Layout = () => {
  const [isAIMode, setIsAIMode] = useState(false);
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  
  const handleAISearch = (query) => {
    setAiSearchQuery(query);
  };

  return (
    <div className="bg-[#0b1120] min-h-screen">
      <QuickCommerceHeader 
        isAIMode={isAIMode} 
        setIsAIMode={setIsAIMode}
        onAISearch={handleAISearch}
      />
      <ScrollRestoration />
      <Outlet context={{ isAIMode, setIsAIMode, aiSearchQuery, handleAISearch }} />
      <Footer />
    </div>
  );
}

function App() {
  const router = createBrowserRouter([
    {
      id: "root", // Add ID so children can access this loader data
      path: "/",
      element: <Layout />,
      loader: productsData, // Only load once at the root level
      errorElement: <ErrorPage />,
      children: [
        {
          index: true,
          element: <Home />,
        },
        {
          path: "/allProducts",
          children: [
            {
              index: true,
              element: <Products />,
            },
            {
              path: ":title",
              element: <ProductDetails />,
            },
          ]
        },
        {
          path: ':category',
          children: [
            {
              index: true,
              element: <Products />,
            },
            {
              path: ":title",
              element: <ProductDetails />,
            },
          ],
        },
        {
          path: "/cart",
          element: <Cart />
        },
        {
          path: "/orders",
          element: <Orders />,
        },
      ],
    },
    {
      path: "/signIn",
      children: [
        {
          index: true,
          element: <SignIn />
        },
        {
          path: "forgotPassword",
          element: <ForgotPassword />,
        },
      ],
    },
    {
      path: "/createAccount",
      element: <CreateAccount />,
    },
    {
      path: "/checkout",
      element: <Checkout />,
    },
  ]);


  return (
    <UserOrdersProvider>
      <UserCartProvider>
        <UserAddressProvider>
          <RouterProvider router={router} />
        </UserAddressProvider>
      </UserCartProvider>
    </UserOrdersProvider>
  );
}

export default App;
