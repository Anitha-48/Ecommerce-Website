import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "./css_fiels/orders.css";
import { API_BASE_URL } from "../api";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE_URL}my-orders/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    })
      .then((response) => setOrders(response.data))
      .catch(() => toast.error("Could not load your orders. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="orders-page">
      <header className="orders-header">
        <div>
          <p className="orders-eyebrow">Your account</p>
          <h1>My orders</h1>
        </div>
        <Link to="/dashboard">Continue shopping</Link>
      </header>

      {loading && <p className="orders-message">Loading your orders...</p>}
      {!loading && orders.length === 0 && (
        <section className="orders-empty">
          <h2>No orders yet</h2>
          <p>Your orders will appear here after checkout.</p>
          <Link to="/dashboard">Browse traditional foods</Link>
        </section>
      )}

      <div className="orders-list">
        {orders.map((order) => (
          <article className="order-card" key={order.id}>
            <header className="order-card-header">
              <div>
                <h2>Order #{order.id}</h2>
                <p>{new Date(order.created_at).toLocaleString()}</p>
              </div>
              <span className={`order-status status-${order.status}`}>
                {order.status}
              </span>
            </header>

            <ul className="order-items">
              {order.items.map((item) => (
                <li key={item.id}>
                  <span>{item.product_name} × {item.quantity}</span>
                  <span>
                    ₹{(Number(item.product_price) * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>

            <footer className="order-card-footer">
              <span>
                {order.payment_method === "cod" ? "Cash on delivery" : "Razorpay"}
                {" · "}
                {order.payment_status === "paid" ? "Paid" : "Payment due"}
              </span>
              <strong>Total: ₹{Number(order.total_price).toFixed(2)}</strong>
            </footer>
          </article>
        ))}
      </div>
    </main>
  );
}

export default Orders;
