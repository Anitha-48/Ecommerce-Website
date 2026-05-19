import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import Login from "./components/login";
import Register from "./components/register";
import Navbar from "./components/navbar";
import Dashboard from "./components/dashboard";
import Products from "./components/product";
import MainPage from "./components/mainpage";
import Cart from "./components/order";
import Checkout from "./components/checkoutpage";
import OrderSuccess from "./components/ordersuccess";
import Wishlist from "./components/wishlist";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <Router>
        <ToastContainer />
        <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/checkoutpage" element={<Checkout />} />
        <Route path="/ordersuccess" element={<OrderSuccess />} />
        
        </Routes>
       </Router>
  );
}

export default App; 














