import React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import "./css_fiels/home.css";
import "./css_fiels/about.css";
import "./css_fiels/contact.css" ;
import axios from "axios";






function Home() {
  return (
    <div className="home">

      {/* 🔥 BACKGROUND VIDEO */}
      <video autoPlay loop muted className="bg-video">
        <source src="/videos/food-bg.mp4" type="video/mp4" />
      </video>

      {/* 🌑 OVERLAY */}
      <div className="overlay"></div>

      {/* 🎯 CONTENT */}
      <div className="hero">
        <h1 className="title">🍛 தமிழன் Treats</h1>
        <p className="subtitle">
          Authentic Tamil Nadu Traditional Foods & Snacks
        </p>

        {/* <button className="explore-btn">
          Explore Menu →
        </button> */}
      </div>

    </div>
  );
}

export default Home;



/*  ABOUT PAGE */


export function About() {
  const foods = [
    {
      title: "Biriyani of Tamil Nadu",
      image: "/images/aboutpage1.webp",
      
    },
     {
      title: "Village Foods",
      image: "/images/aboutpage7.webp",
    },
      {
      title: "Traditional Snacks",
      image: "/images/aboutpage4.webp",
    },
    {
      title: "Chettinad Cuisine",
      image: "/images/aboutpage2.webp",
    },
    {
      title: "Village Foods",
      image: "/images/aboutpage8.webp",
    },
    {
      title: "Kongunadu Cuisine",
      image: "/images/aboutpage3.jpg",
    },
   
    {
      title: "Village Foods",
      image: "/images/aboutpage5.webp",
    },
     {
      title: "Village Foods",
      image: "/images/aboutpage6.webp",
    },
    
  ];

  return (
    <div className="about-container" id="about">

      <h1 className="about-title"> Recipes </h1>

      <div className="food-grid">
        {foods.map((item, index) => (
          <div className="food-card" key={index}>

            <img src={item.image} alt={item.title} />

            <div className="overlay">
              <h2>{item.title}</h2>
              <h2>{item.description}</h2>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}

 About;





/* CONTACT PAGE */



export function Contact() {

  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://127.0.0.1:8000/contact/", form);

      alert("Message sent ✅");

      setForm({
        name: "",
        email: "",
        message: "",
      });

    } catch (err) {
      console.log(err);
      alert("Error ❌");
    }
  };

  return (
    <section id="contact" className="contact-section">

      <h1 className="contact-title">Get in Touch</h1>
      <p className="contact-sub">
        We'd love to hear from you.
      </p>

      <div className="contact-container">

        {/* LEFT */}
        <div className="contact-info">
          <h3>🍛 தமிழன் Treats</h3>
          <p>📍 Chennai, Tamil Nadu</p>
          <p>📞 +9 18870086705</p>
          <p>✉️ support@thamizhanfoods.com</p>
          <img src="/images/logo.png"></img>
        </div>

        {/* RIGHT FORM */}
        <form className="contact-form" onSubmit={handleSubmit}>

          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            required
          />

          <textarea
            name="message"
            placeholder="Your Message"
            rows="4"
            value={form.message}
            onChange={(e) =>
              setForm({ ...form, message: e.target.value })
            }
            required
          />

          <button type="submit">Send Message</button>

        </form>

      </div>

    </section>
  );
}

Contact;
   





