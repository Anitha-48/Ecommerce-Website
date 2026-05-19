import { useEffect, useState } from "react";
import axios from "axios";
import "./css_fiels/product.css";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";


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

  const BASE = "http://127.0.0.1:8000/";
  const token = localStorage.getItem("access_token");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "multipart/form-data",   // ✅ REQUIRED
  };

  // 🟢 GET ALL PRODUCTS
  const fetchProducts = () => {
    axios.get(`${BASE}all_products/`)
      .then(res => setProducts(res.data))
      .catch(err => console.log(err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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
