import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./css_fiels/register.css"
import { toast } from "react-toastify";
import { API_BASE_URL } from "../api";

function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
       await axios.post(
        `${API_BASE_URL}register/`,
        user
      );

      alert("✅ Registration Successful");
      // ✅ CLEAR FORM HERE
    setUser({
      username: "",
      email: "",
      password: "",
    });

      // ❌ DO NOT STORE TOKEN HERE
      // ❌ NO AUTO LOGIN

      navigate("/login", { state: location.state });

    } catch (err) {
      console.log(err.response);
      toast.error ("❌ Registration Failed");
    }
  };

  return (
    <div className="login-container">
            <form className="login-form" onSubmit={handleRegister}>

          <h1>🥥 தமிழன் Treats</h1>
          <p>Create Your Account</p>

          <input
            type="text"
            name="username"
            placeholder="Enter Username"
            value={user.username}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Enter Email"
            value={user.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Enter Password"
            value={user.password}
            onChange={handleChange}
            required
          />

          <button>Register</button>

          <p>
            Already have an account? <Link to="/login">Login here</Link>
          </p>

        </form>
      </div>
     );
}

export default Register;
