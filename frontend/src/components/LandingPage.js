import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LandingPage.module.css";
import Chatbot from "./chatbot";

const LandingPage = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState(localStorage.getItem("lang") || "en");

  // ✅ Function to translate text dynamically using Google Translate API
  const translatePage = async (lang) => {
    setLanguage(lang);
    localStorage.setItem("lang", lang);

    const elements = document.querySelectorAll("[data-translate]");
    elements.forEach((el) => {
      const originalText = el.getAttribute("data-translate");
      if (lang === "en") {
        el.innerText = originalText;
      } else {
        fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${lang}&dt=t&q=${encodeURIComponent(
            originalText
          )}`
        )
          .then((res) => res.json())
          .then((data) => {
            el.innerText = data[0][0][0];
          })
          .catch(() => {
            el.innerText = originalText;
          });
      }
    });
  };

  // ✅ Auto-apply translation on page load
  useEffect(() => {
    translatePage(language);
  }, [language]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: "bot", text: "Error fetching response." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.landing}>
      {/* ✅ Language Switcher */}
      <div className={styles.languageBar}>
        <span
          style={{ cursor: "pointer", fontWeight: language === "en" ? "bold" : "normal" }}
          onClick={() => translatePage("en")}
        >
          English
        </span>{" "}
        |{" "}
        <span
          style={{ cursor: "pointer", fontWeight: language === "kn" ? "bold" : "normal" }}
          onClick={() => translatePage("kn")}
        >
          ಕನ್ನಡ
        </span>
      </div>

      <header className={styles.navbar}>
        <div className={styles.logo}>
          <img src="/Images/ruraledge-logo.png" alt="RuralEdge Logo" className={styles.logoImg} />
          <span data-translate="RuralEdge">RuralEdge</span>
        </div>

        <nav className={styles.navLinks}>
          <a href="#about" data-translate="About Us">About Us</a>
          <a href="#services" data-translate="Services">Services</a>
          <a href="#how" data-translate="How It Works">How It Works</a>
          <a href="#features" data-translate="Why Us">Why Us</a>
          <a href="#testimonials" data-translate="Testimonials">Testimonials</a>
          <button className={styles.navBtn} onClick={() => navigate("/register")} data-translate="Register">Register</button>
          <button className={styles.navBtnOutline} onClick={() => navigate("/login")} data-translate="Login">Login</button>
        </nav>
      </header>

      <section className={styles.heroSection}>
        <div className={styles.container}>
          <h1 className={styles.heroHeading} data-translate="Empowering Rural Governance">
            Empowering Rural Governance
          </h1>
          <p className={styles.heroSubtext} data-translate="Smart complaints, fast resolutions, and citizen participation at the grassroots level.">
            Smart complaints, fast resolutions, and citizen participation at the grassroots level.
          </p>
        </div>
      </section>

      <section id="about" className={`${styles.contentSection} ${styles.boxSection}`}>
        <div className={styles.container}>
          <h2 data-translate="About Us">About Us</h2>
          <p data-translate="RuralEdge is a tech-driven initiative to modernize grievance redressal in rural areas. We connect citizens directly with local authorities using mobile and web platforms, ensuring transparency, accountability, and effective service delivery. Built for scalability and inclusivity, RuralEdge operates with low data usage and supports regional languages, making it ideal for rural environments.">
            <strong>RuralEdge</strong> is a tech-driven initiative to modernize grievance redressal in rural areas. We connect citizens directly with local authorities using mobile and web platforms, ensuring transparency, accountability, and effective service delivery. Built for scalability and inclusivity, RuralEdge operates with low data usage and supports regional languages, making it ideal for rural environments.
          </p>
        </div>
      </section>

      <section id="services" className={`${styles.contentSection} ${styles.boxSection}`}>
        <div className={styles.container}>
          <h2 data-translate="Our Services">Our Services</h2>
          <div className={styles.serviceButtons}>
            <button className={styles.serviceBtn} onClick={() => setSelectedService("water")} data-translate="Water Management">Water Management</button>
            <button className={styles.serviceBtn} onClick={() => setSelectedService("waste")} data-translate="Waste Management">Waste Management</button>
            <button className={styles.serviceBtn} onClick={() => setSelectedService("light")} data-translate="Streetlight Management">Streetlight Management</button>
          </div>

          {selectedService === "water" && (
            <div className={styles.serviceDescription}>
              <h3 data-translate="💧 Water Management">💧 Water Management</h3>
              <p data-translate="Report irregular water supply, pipeline damage, or water quality issues with geo-location tagging and instant photos.">
                Report irregular water supply, pipeline damage, or water quality issues with geo-location tagging and instant photos.
              </p>
            </div>
          )}

          {selectedService === "waste" && (
            <div className={styles.serviceDescription}>
              <h3 data-translate="🗑 Waste Management">🗑 Waste Management</h3>
              <p data-translate="Flag garbage collection delays or unhygienic spots with photos and location tagging. Improve sanitation in your locality.">
                Flag garbage collection delays or unhygienic spots with photos and location tagging. Improve sanitation in your locality.
              </p>
            </div>
          )}

          {selectedService === "light" && (
            <div className={styles.serviceDescription}>
              <h3 data-translate="💡 Streetlight Management">💡 Streetlight Management</h3>
              <p data-translate="Instantly notify authorities about faulty or broken streetlights to improve safety and visibility during the night.">
                Instantly notify authorities about faulty or broken streetlights to improve safety and visibility during the night.
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="how" className={`${styles.contentSection} ${styles.boxSection}`}>
        <div className={styles.container}>
          <h2 data-translate="How It Works">How It Works</h2>
          <ol>
            <li data-translate="Step 1: Register with your phone or email in just a few seconds."><strong>Step 1:</strong> Register with your phone or email in just a few seconds.</li>
            <li data-translate="Step 2: Report issues with photos and auto-location tagging."><strong>Step 2:</strong> Report issues with photos and auto-location tagging.</li>
            <li data-translate="Step 3: System assigns the complaint to the correct department/staff."><strong>Step 3:</strong> System assigns the complaint to the correct department/staff.</li>
            <li data-translate="Step 4: Track progress from assigned to resolved."><strong>Step 4:</strong> Track progress from assigned to resolved.</li>
            <li data-translate="Step 5: Receive SMS alerts and submit feedback after resolution."><strong>Step 5:</strong> Receive SMS alerts and submit feedback after resolution.</li>
          </ol>
        </div>
      </section>

      <section id="features" className={`${styles.contentSection} ${styles.boxSection}`}>
        <div className={styles.container}>
          <h2 data-translate="Why Choose RuralEdge?">Why Choose RuralEdge?</h2>
          <ul>
            <li data-translate="📌 GPS-Tagged Complaints: Ensures accurate problem location and faster resolution."><strong>📌 GPS-Tagged Complaints:</strong> Ensures accurate problem location and faster resolution.</li>
            <li data-translate="🖼 Photo Evidence: Attach real photos of the issue to increase response urgency."><strong>🖼 Photo Evidence:</strong> Attach real photos of the issue to increase response urgency.</li>
            <li data-translate="🔔 Smart Alerts: Receive all civic service alerts in real-time."><strong>🔔 Smart Alerts:</strong> Receive all civic service alerts in real-time.</li>
            <li data-translate="🔤 Low Data Usage: Fully optimized for slow or limited internet access."><strong>🔤 Low Data Usage:</strong> Fully optimized for slow or limited internet access.</li>
            <li data-translate="🌐 Language Options: Available in English & Kannada."><strong>🌐 Language Options:</strong> Available in English & Kannada.</li>
            <li data-translate="📈 Analytics: Helps local administrators plan better using visual data dashboards."><strong>📈 Analytics:</strong> Helps local administrators plan better using visual data dashboards.</li>
          </ul>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div>
            <h4 data-translate="About RuralEdge">About RuralEdge</h4>
            <p data-translate="RuralEdge is committed to improving rural service delivery by digitizing complaint reporting, tracking, and resolution.">
              RuralEdge is committed to improving rural service delivery by digitizing complaint reporting, tracking, and resolution.
            </p>
          </div>
          <div>
            <h4 data-translate="Contact Us">Contact Us</h4>
            <p><strong>Email:</strong> support@ruraledge.gov.in</p>
            <p><strong>Phone:</strong> 1800-123-456</p>
            <p><strong>Address:</strong> RuralEdge Grievance Office, Karnataka</p>
          </div>
          <div>
            <h4 data-translate="FAQ">FAQ</h4>
            <p data-translate="Do I need an account to report? Yes, a registered account helps track complaints."><strong>Do I need an account to report?</strong> Yes, a registered account helps track complaints.</p>
            <p data-translate="Can I change my language preference later? Yes, anytime from the top bar."><strong>Can I change my language preference later?</strong> Yes, anytime from the top bar.</p>
            <p data-translate="Will I be notified when my complaint is resolved? Yes, via SMS and tracker."><strong>Will I be notified when my complaint is resolved?</strong> Yes, via SMS and tracker.</p>
          </div>
        </div>
        <p style={{ textAlign: 'center', marginTop: '1rem' }} data-translate="© 2025 RuralEdge. All Rights Reserved.">
          © 2025 RuralEdge. All Rights Reserved.
        </p>

        {/* <div className={styles.chatContainer}>
          <div className={styles.chatWindow}>
            {messages.map((msg, idx) => (
              <div key={idx} className={msg.sender === "user" ? styles.userMsg : styles.botMsg}>
                {msg.text}
              </div>
            ))}
            {loading && <div className={styles.botMsg + " " + styles.typing} data-translate="Typing...">Typing...</div>}
          </div>
          <form className={styles.chatInput} onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Ask something..."
              data-translate="Ask something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" data-translate="Send">Send</button>
          </form>
        </div> */}
      </footer>
      <Chatbot/>
    </div>
  );
};

export default LandingPage;
