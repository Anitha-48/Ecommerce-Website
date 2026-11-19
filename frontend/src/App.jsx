import React from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Login from "./components/login";
import Register from "./components/register";
import Dashboard from "./components/dashboard";
import Products from "./components/product";
import MainPage from "./components/mainpage";
import Cart from "./components/order";
import Checkout from "./components/checkoutpage";
import OrderSuccess from "./components/ordersuccess";
import Wishlist from "./components/wishlist";
import Orders from "./components/orders";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function RequireAuth({ children, adminOnly = false }) {
  const location = useLocation();

  if (!localStorage.getItem("access_token")) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && localStorage.getItem("is_admin") !== "true") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/products" element={<RequireAuth adminOnly><Products /></RequireAuth>} />
        <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
        <Route path="/wishlist" element={<RequireAuth><Wishlist /></RequireAuth>} />
        <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
        <Route path="/checkoutpage" element={<RequireAuth><Checkout /></RequireAuth>} />
        <Route path="/ordersuccess" element={<RequireAuth><OrderSuccess /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App; 














