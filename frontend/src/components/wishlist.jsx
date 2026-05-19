import { useEffect, useState } from "react";
import axios from "axios";
import "./css_fiels/wishlist.css"
import { useNavigate } from "react-router-dom";

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);

  const token = localStorage.getItem("access_token");
  const navigate = useNavigate();

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const BASE = "http://127.0.0.1:8000/";

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = () => {
    axios.get(`${BASE}wishlist/`, { headers })
      .then(res => setWishlist(res.data))
      .catch(err => console.log(err));
  };

  // 🗑 REMOVE
  const removeItem = async (id) => {
    await axios.delete(`${BASE}deletewishlist/${id}/`, { headers });
    fetchWishlist();
  };

  // ➕ ADD TO CART
  const addToCart = async (productId) => {
    await axios.post(`${BASE}addtocart/`, {
      product: productId
    }, { headers });

    alert("Added to Cart 🛒");
  };

  return (
    <div className="wishlist-container">
      
  {/* 🔙 BACK BUTTON
  <button
    className=""
    onClick={() => navigate(-1)}
  >
    ← Back
  </button> */}

  {/* remaining code */}

      <h1>❤️ Your Wishlist</h1>

      {wishlist.length === 0 && (
        <p className="empty">No items in wishlist 😢</p>
      )}

      {wishlist.map(item => (
        <div className="wishlist-card" key={item.id}>

          <div className="wishlist-left">

           <img
  src={
    item.picture
      ? `http://127.0.0.1:8000${item.picture}`
      : "/images/no-image.png"
  }
  alt={item.product_name}
  className="wishlist-img"
/>

            <div>
              <h3>{item.product_name}</h3>
              <p>₹ {item.product_price}</p>
            </div>

          </div>

          <div className="wishlist-actions">

            <button
              className="cart-btn"
              onClick={() => addToCart(item.product)}
            >
              🛒 Add
            </button>

            <button
              className="remove-btn"
              onClick={() => removeItem(item.id)}
            >
              🗑 Remove
            </button>

          </div>

        </div>
      ))}

    </div>
  );
}


export default Wishlist;
