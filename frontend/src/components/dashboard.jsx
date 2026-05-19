import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./css_fiels/dashboard.css";

function Dashboard() {

  const BASE = "http://127.0.0.1:8000/";

  const token = localStorage.getItem("access_token");
  const username = localStorage.getItem("username");

  const navigate = useNavigate();

  // STATES
  const [collapsed, setCollapsed] = useState(false);

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  const [search, setSearch] = useState("");

  // AUTH HEADERS
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // FETCH DATA
  useEffect(() => {
    fetchProducts();
    fetchCart();
    fetchWishlist();
  }, []);

  // GET PRODUCTS
  const fetchProducts = () => {
    axios.get(`${BASE}all_products/`)
      .then(res => setProducts(res.data))
      .catch(err => console.log(err));
  };

  // GET CART
  const fetchCart = () => {
    axios.get(`${BASE}cart/`, { headers })
      .then(res => setCart(res.data))
      .catch(err => console.log(err));
  };

  // GET WISHLIST
  const fetchWishlist = () => {
    axios.get(`${BASE}wishlist/`, { headers })
      .then(res => setWishlist(res.data))
      .catch(err => console.log(err));
  };

  // SEARCH FILTER
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // LOGOUT
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // ADD TO CART
  const addToCart = async (product) => {
    await axios.post(
      `${BASE}addtocart/`,
      { product: product.id },
      { headers }
    );

    fetchCart();
  };

  // INCREASE QTY
  const increaseQty = async (item) => {

    await axios.put(
      `${BASE}addtocartupdate/${item.id}/`,
      { quantity: item.quantity + 1 },
      { headers }
    );

    fetchCart();
  };

  // DECREASE QTY
  const decreaseQty = async (item) => {

    if (item.quantity === 1) {

      await axios.delete(
        `${BASE}addtocartdelete/${item.id}/`,
        { headers }
      );

    } else {

      await axios.put(
        `${BASE}addtocartupdate/${item.id}/`,
        { quantity: item.quantity - 1 },
        { headers }
      );
    }

    fetchCart();
  };

  // ADD WISHLIST
  const addToWishlist = async (product) => {

    await axios.post(
      `${BASE}addwishlist/`,
      { product: product.id },
      { headers }
    );

    fetchWishlist();
  };

  // REMOVE WISHLIST
  const removeWishlist = async (id) => {

    await axios.delete(
      `${BASE}deletewishlist/${id}/`,
      { headers }
    );

    fetchWishlist();
  };

  return (

    <div className={`dashboard-layout ${collapsed ? "collapsed" : ""}`}>

      {/* SIDEBAR */}
      <div className="sidebar">

        <div className="sidebar-top">

          <div className="avatar">
            {username?.charAt(0).toUpperCase()}
          </div>

          <h3 className="username">
            Welcome, {username} 👋
          </h3>

        </div>

        {/* MENU */}
        <div className="sidebar-menu">

          <button onClick={() => navigate("/dashboard")}>
            🏠 Dashboard
          </button>

          <button onClick={() => navigate("/cart")}>
            🛒 Cart ({cart.length})
          </button>

          <button onClick={() => navigate("/wishlist")}>
            ❤️ Wishlist ({wishlist.length})
          </button>

          <button onClick={handleLogout}>
            🚪 Logout
          </button>

        </div>

      </div>

      {/* MOBILE OVERLAY */}
      {collapsed && (
        <div
          className="overlay-bg"
          onClick={() => setCollapsed(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <div className="main-content">

        {/* HEADER */}
        <div className="header">

          {/* SIDEBAR TOGGLE */}
          <button
            className="toggle-btn"
            onClick={() => setCollapsed(!collapsed)}
          >
            ☰
          </button>

          {/* BACK BUTTON */}
          <button
            className="btn"
            onClick={() => navigate(-1)}
          >
            ⬅ Back
          </button>

          {/* SEARCH */}
          <input
            className="search"
            placeholder="Search traditional foods..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* RIGHT STATUS */}
          <div className="header-right">

            <p>🛒 {cart.length}</p>

            <p>❤️ {wishlist.length}</p>

          </div>

        </div>

        {/* PAGE TITLE */}
        <div className="dashboard-title">

          {/* <h1>🍛 Thamizhan Treats Dashboard</h1>

          <p>
            Explore authentic Tamil Nadu traditional snacks & sweets
          </p> */}

        </div>

        {/* PRODUCT GRID */}
        <div className="grid">

          {filtered.map((product) => {

            const cartItem =
              cart.find(c => c.product === product.id);

            const wishItem =
              wishlist.find(w => w.product === product.id);

            return (

              <div className="card" key={product.id}>

                {/* PRODUCT IMAGE */}
                <img
                  src={product.picture}
                  alt={product.name}
                />

                {/* PRODUCT DETAILS */}
                <h3>{product.name}</h3>

                <p className="price">
                  ₹ {product.price}
                </p>

                {/* CART BUTTONS */}
                {cartItem ? (

                  <div className="qty">

                    <button
                      onClick={() => decreaseQty(cartItem)}
                    >
                      -
                    </button>

                    <span>{cartItem.quantity}</span>

                    <button
                      onClick={() => increaseQty(cartItem)}
                    >
                      +
                    </button>

                  </div>

                ) : (

                  <button
                    className="cart-btn"
                    onClick={() => addToCart(product)}
                  >
                    🛒 Add to Cart
                  </button>

                )}

                {/* WISHLIST */}
                {wishItem ? (

                  <button
                    className="wishlist-btn remove"
                    onClick={() => removeWishlist(wishItem.id)}
                  >
                    ❤️ Remove
                  </button>

                ) : (

                  <button
                    className="wishlist-btn"
                    onClick={() => addToWishlist(product)}
                  >
                    ❤️ Wishlist
                  </button>

                )}

              </div>
            );
          })}

        </div>

      </div>
    </div>
  );
}

export default Dashboard;