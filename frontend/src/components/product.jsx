import { useEffect, useState } from "react";
import axios from "axios";
import "./css_fiels/product.css";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";


function Products() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    picture: null ,
  });

  const [editId, setEditId] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  const BASE = API_BASE_URL;
  const token = localStorage.getItem("access_token");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "multipart/form-data",   // ✅ REQUIRED
  };

  // 🟢 GET ALL PRODUCTS
  const fetchProducts = () => {
    axios.get(`${BASE}all_products/`)
      .then(res => setProducts(res.data))
      .catch(() => toast.error("Could not load products."));
  };

  useEffect(() => {
    axios.get(`${BASE}all_products/`)
      .then(res => setProducts(res.data))
      .catch(() => toast.error("Could not load products."));
    axios.get(`${BASE}admin-api/analytics/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    })
      .then(res => setAnalytics(res.data))
      .catch(() => toast.error("Could not load admin analytics."));
  }, [BASE, token]);

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.patch(
        `${BASE}admin-api/orders/${orderId}/`,
        { status },
        { headers }
      );
      setAnalytics((current) => ({
        ...current,
        orders: current.orders.map((order) =>
          order.id === orderId ? { ...order, status } : order
        ),
      }));
      toast.success("Order status updated.");
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not update order status.");
    }
  };

  // 🟢 INPUT CHANGE
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFile = (e) => {
    setForm({ ...form, picture: e.target.files[0] });
  };

  // 🟢 CREATE / UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault();
    

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("price", form.price);
    formData.append("category", form.category);
    console.log(form)
    if (form.picture) {
      formData.append("picture", form.picture);
    }

    try {
      if (editId) {
        // UPDATE
        await axios.patch(
          `${BASE}update_products/${editId}/`,
          formData,
          { headers }
        );
      } else {
        // CREATE
        await axios.post(
          `${BASE}create_products/`,
          formData,
          { headers }
        );
      }

      toast.success("Product Created ✅");

      setForm({
        name: "",
        price: "",
        category: "",
        picture: null,
      });

      setEditId(null);
      fetchProducts();

    } catch (err) {
      console.log(err);
      toast.error("Error ❌");
    }
  };

  // 🟡 EDIT
  const handleEdit = (item) => {
    setForm({
      name: item.name,
      price: item.price,
      category: item.category,
      picture: null,
    });
    setEditId(item.id);
  };
  

  // 🔴 DELETE
  const handleDelete = async (id) => {
    await axios.delete(
      `${BASE}delete_products/${id}/`,
      { headers }
    );
    fetchProducts();
  };

  return (
    <div className="container">
      <button  className="back"  onClick={() => navigate(-1)} >
          ⬅ Back
      </button>

      <h1 className="title"> Admin Panel</h1>

      {analytics && (
        <section className="admin-analytics" aria-label="Store analytics">
          <div className="analytics-summary">
            <article><span>Customers</span><strong>{analytics.summary.customers}</strong></article>
            <article><span>Products</span><strong>{analytics.summary.products}</strong></article>
            <article><span>Orders</span><strong>{analytics.summary.orders}</strong></article>
            <article>
              <span>Paid revenue</span>
              <strong>₹{Number(analytics.summary.paid_revenue).toFixed(2)}</strong>
            </article>
            <article>
              <span>COD due</span>
              <strong>₹{Number(analytics.summary.pending_cod_revenue).toFixed(2)}</strong>
            </article>
          </div>

          <section className="analytics-panel">
            <h2>Paid sales · last 7 days</h2>
            <div className="sales-chart">
              {analytics.sales_by_day.map((day) => {
                const maxSales = Math.max(
                  ...analytics.sales_by_day.map((entry) => Number(entry.total)),
                  1
                );
                const value = Number(day.total);
                return (
                  <div className="sales-day" key={day.date} title={`₹${value.toFixed(2)}`}>
                    <span>₹{value.toFixed(0)}</span>
                    <div className="sales-bar-track">
                      <div
                        className="sales-bar"
                        style={{ height: `${Math.max((value / maxSales) * 100, value ? 4 : 0)}%` }}
                      />
                    </div>
                    <small>{new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" })}</small>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="analytics-panel">
            <h2>Recent orders</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {analytics.orders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{order.username}</td>
                      <td>{new Date(order.created_at).toLocaleDateString()}</td>
                      <td>₹{Number(order.total_price).toFixed(2)}</td>
                      <td>{order.payment_method === "cod" ? "COD" : "Razorpay"} · {order.payment_status}</td>
                      <td>
                        <select
                          value={order.status}
                          onChange={(event) => updateOrderStatus(order.id, event.target.value)}
                          aria-label={`Order ${order.id} status`}
                        >
                          {["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="analytics-panel">
            <h2>Customer accounts</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Username</th><th>Email</th><th>Joined</th></tr></thead>
                <tbody>
                  {analytics.customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>{customer.username}</td>
                      <td>{customer.email || "—"}</td>
                      <td>{new Date(customer.joined_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="analytics-panel">
            <h2>Product performance</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Units sold</th><th>Orders</th></tr></thead>
                <tbody>
                  {analytics.products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                      <td>₹{Number(product.price).toFixed(2)}</td>
                      <td>{product.units_sold}</td>
                      <td>{product.order_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      )}

      {/* FORM */}
      <form className="form" onSubmit={handleSubmit}>

        <input
          name="name"
          placeholder="Product Name"
          value={form.name}
          onChange={handleChange}
        />

        <input
          name="price"
          placeholder="Product Price"
          value={form.price}
          onChange={handleChange}
        />

        <input
          name="category"
          placeholder="Product Category"
          value={form.category}
          onChange={handleChange}
        />

        <input
          type="file"
          onChange={handleFile}
        />

        <button>
          {editId ? "Update Product" : "Add Product"}
        </button>

      </form>

      <hr />

      {/* PRODUCTS */}
      <div className="grid">
        {products.map((item) => (
          <div className="card" key={item.id}>

            <img
              src={item.picture}
              alt={item.name}
              style={{
                width: "100px",
                height: "100px",
                objectFit: "cover",
                borderRadius: "10px"
              }}
            />

            <h3>{item.name}</h3>
            <p>₹ {item.price}</p>
            <p>{item.category}</p>

            <div className="btns">
              <button onClick={() => handleEdit(item)}>Update</button>
              <button onClick={() => handleDelete(item.id)}>Delete</button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}

export default Products;
