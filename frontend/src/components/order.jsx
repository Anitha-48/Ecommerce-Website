import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./css_fiels/order.css";
import { API_BASE_URL } from "../api";

function Cart() {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();
  const BASE = API_BASE_URL;

  useEffect(() => {
    axios.get(`${BASE}cart/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    })
      .then(res => setCart(res.data))
      .catch(() => console.error("Could not load cart."));
  }, [BASE]);

  const total = cart.reduce(
    (sum, item) => sum + item.quantity * (item.product_price || 0),
    0
  );

  return (
    <div className="cart-container">

      <h1>🛒 Your Cart</h1>

      {/* ❌ EMPTY CART UI */}
      {cart.length === 0 && (
        <p className="empty">Your cart is empty 🥲</p>
      )}



      {/* ✅ CART ITEMS */}

      {cart.map(item => (
        <div className="cart-card" key={item.id}>

             <div className="cart-left">

              
              
            <h3>{item.product_name}</h3>
            <p>Qty: {item.quantity}</p>
          </div>

          <div>
            <p>₹ {(item.quantity * item.product_price) || 0}</p>
          </div>

        </div>
      ))}

      {/* ✅ TOTAL */}
      {cart.length > 0 && (
        <>
          <h2 className="cart-total">
            Total: ₹ {total}
          </h2>

          <button
            className="checkout-btn"
            onClick={() => navigate("/checkoutpage")}
          >
            Proceed to Checkout 🚀
          </button>
        
        </>
      )}

    </div>
  );
}

export default Cart;
