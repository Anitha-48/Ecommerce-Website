import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./css_fiels/checkoutpage.css";

function Checkout() {
  const navigate = useNavigate();

  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);

  const [form, setForm] = useState({
    address: "",
    phone: "",
  });

  const token = localStorage.getItem("access_token");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const BASE = "http://127.0.0.1:8000/";

  // 🟢 HANDLE INPUT
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🟢 FETCH CART + CALCULATE TOTAL
  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await axios.get(`${BASE}cart/`, { headers });

      setCart(res.data);

      const calculatedTotal = res.data.reduce(
        (sum, item) =>
          sum + item.quantity * (item.product_price || 0),
        0
      );

      setTotal(calculatedTotal);

    } catch (err) {
      console.log(err);
    }
  };

  // 🟢 PLACE ORDER
  const handleOrder = async () => {
    // ✅ VALIDATION
    if (!form.address || !form.phone) {
      alert("Please fill all fields");
      return;
    }

    try {
      const items = cart.map(c => ({
        product: c.product,
        quantity: c.quantity,
      }));

      // ✅ CREATE ORDER
      await axios.post(`${BASE}order/`, {
        address: form.address,
        phone: form.phone,
        total_price: total,
        items: items,
      }, { headers });

      // 🔥 CLEAR CART
      await Promise.all(
        cart.map(item =>
          axios.delete(`${BASE}addtocartdelete/${item.id}/`, { headers })
        )
      );

      alert("✅ Order Placed Successfully!");

      navigate("/ordersuccess");

    } catch (err) {
      console.log(err);
      alert("❌ Order Failed");
    }
  };

  return (
    <div className="checkout-container">

      <h1 className="checkout-title">📦 Checkout</h1>

      <input
        name="address"
        placeholder="Enter Address"
        value={form.address}
        onChange={handleChange}
      />

      <input
        name="phone"
        placeholder="Phone Number"
        value={form.phone}
        onChange={handleChange}
      />

      {/* 🧾 TOTAL */}
      <div className="total-box">
        <p>Items Total: ₹ {total}</p>
        <p>Delivery: ₹ 40</p>
        <h3>Total Payable: ₹ {total + 40}</h3>
      </div>

      <button className="checkout-btn" onClick={handleOrder}>
        Place Order 🚀
      </button>

    </div>
  );
}

export default Checkout;
