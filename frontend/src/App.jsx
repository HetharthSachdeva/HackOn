import React, { useState, useEffect, Suspense, lazy } from "react";
import { createBrowserRouter, RouterProvider, Outlet, ScrollRestoration } from "react-router-dom";
import QuickCommerceHeader from "./components/header/QuickCommerceHeader";
import Footer from "./components/footer/Footer";

// Lazy load route components
const Home = lazy(() => import("./components/home/Home"));
const ErrorPage = lazy(() => import("./components/error/ErrorPage"));
const SignIn = lazy(() => import("./components/logIn/SignIn"));
const CreateAccount = lazy(() => import("./components/logIn/CreateAccount"));
const ForgotPassword = lazy(() => import("./components/logIn/ForgotPassword"));
const Products = lazy(() => import("./components/products/Products"));
const ProductDetails = lazy(() => import("./components/products/ProductDetails"));
const Cart = lazy(() => import("./components/cart/cart"));
const Orders = lazy(() => import("./components/orders/Orders"));
const Checkout = lazy(() => import("./components/checkout/Checkout"));

import { UserCartProvider } from "./context/userCartContext";
import { UserAddressProvider } from "./context/userAddressContext";
import { UserOrdersProvider } from "./context/userOrderContext";
import { productsData } from "./api/api";
import { useDispatch } from "react-redux";
import { setUserInfo, setUserAuthentication, userSignOut } from "./redux/amazonSlice";
import { supabase } from "./api/supabaseClient";


// Layout component to combine components for main path("/") of routers which has to be rendered when website opens for the first time 
const Layout = () => {
  const [isAIMode, setIsAIMode] = useState(false);
  const [aiSearch, setAiSearch] = useState({ query: '', nonce: 0 });
  const [aiImage, setAiImage] = useState(null);

  const handleAISearch = (query) => {
    // Bump nonce every call so identical queries still re-trigger generation
    setAiSearch((prev) => ({ query, nonce: prev.nonce + 1 }));
  };

  return (
    <div className="bg-[#0a0a0a] min-h-screen flex flex-col">
    {/* <div className="bg-[#f89206] min-h-screen"> */}

      <QuickCommerceHeader 
        isAIMode={isAIMode} 
        setIsAIMode={setIsAIMode}
        onAISearch={handleAISearch}
        aiImage={aiImage}
        setAiImage={setAiImage}
      />
      <ScrollRestoration />
      
      <div className="flex-1 flex flex-col">
        <Suspense fallback={<div className="flex h-screen items-center justify-center text-white">Loading...</div>}>
          <Outlet context={{ isAIMode, setIsAIMode, aiSearchQuery: aiSearch.query, aiSearchNonce: aiSearch.nonce, handleAISearch, aiImage, setAiImage }} />
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // 1. Sync current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncSession(session);
    });

    // 2. Listen to session changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      syncSession(session);
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  const syncSession = (session) => {
    if (session) {
      dispatch(setUserInfo({
        id: session.user.id,
        name: session.user.user_metadata.full_name || session.user.email,
        email: session.user.email,
        token: session.access_token, // JWT used to verify on backend
        image: session.user.user_metadata.avatar_url || null,
      }));
      dispatch(setUserAuthentication(true));
    } else {
      dispatch(userSignOut());
      dispatch(setUserAuthentication(false));
    }
  };

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
      element: <Suspense fallback={<div className="flex h-screen items-center justify-center text-black">Loading...</div>}><Outlet /></Suspense>,
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
      element: <Suspense fallback={<div className="flex h-screen items-center justify-center text-black">Loading...</div>}><CreateAccount /></Suspense>,
    },
    {
      path: "/checkout",
      element: <Suspense fallback={<div className="flex h-screen items-center justify-center text-black">Loading...</div>}><Checkout /></Suspense>,
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
