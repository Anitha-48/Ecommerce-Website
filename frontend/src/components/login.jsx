import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./css_fiels/login.css"
import { toast } from "react-toastify";

function Login() {
  const navigate = useNavigate();
const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const res = await axios.post(
      "http://127.0.0.1:8000/login/",
      user
    );

    // ✅ STORE TOKEN
    localStorage.setItem("access_token", res.data.access);
    localStorage.setItem("refresh_token", res.data.refresh);
    // STORE USERNAME PROFLE SEC
    localStorage.setItem("username", res.data.username);


    // ✅ STORE ROLE
    localStorage.setItem("is_admin", res.data.is_admin);

    // 🔥 REDIRECT BASED ON ROLE
    if (res.data.is_admin) {
      navigate("/products");   // ADMIN
    } else {
      navigate("/dashboard");  // USER
    }

  } 
  catch (err) {
    toast.error("❌ Invalid username or password");
  }
};


  return (
    <div className="login-container">
             <form className="login-form" onSubmit={handleLogin}>

          <h1 className="h1">🥥தமிழன் Treats</h1>
          <p>Authentic Tamil Nadu Flavours</p>

          <input
            type="text"
            name="username"
            placeholder="Enter Username"
            value={user.username}
            onChange={handleChange}
            required
          />

          <div className="password-box">
  <input
    type={showPassword ? "text" : "password"}
    name="password"
    placeholder="Enter Password"
    value={user.password}
    onChange={handleChange}
    required
  />

  <span
    className="eye-icon"
    onClick={() => setShowPassword(!showPassword)}
  > {showPassword ? "🚫" : "👁️"}
  </span>
</div>


          <button className="button">Login</button>

          <p>
            New user? <Link to="/register">Register here</Link>
          </p>

          <p className="quote">
            "Taste the tradition of Tamil Nadu ❤️"
          </p>

        </form>
      </div>
      );
}

export default Login;
