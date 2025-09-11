import React, { useState } from "react";


const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");


  const toggleChat = () => setIsOpen(!isOpen);


  const addMessage = (text, sender) => {
    setMessages((prev) => [...prev, { text, sender }]);
  };


  const sendMessage = async () => {
    if (!input.trim()) return;


    const userMessage = input;
    addMessage(userMessage, "user");
    setInput("");


    try {
      const res = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage }),
      });


      const data = await res.json();
      addMessage(data.reply, "bot");
    } catch (error) {
      console.error("Error sending message:", error);
      addMessage("⚠️ Server error. Please try again later.", "bot");
    }
  };


  return (
    <>
      {/* Chat Bubble Button */}
      <button
        onClick={toggleChat}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          background: "#2c7a7b",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: "60px",
          height: "60px",
          fontSize: "24px",
          cursor: "pointer",
          boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
        }}
      >
        💬
      </button>


      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            right: "20px",
            width: "300px",
            height: "400px",
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "#2c7a7b",
              color: "white",
              padding: "10px",
              textAlign: "center",
            }}
          >
            Rural Edge Assistant
          </div>


          <div
            style={{
              flex: 1,
              padding: "10px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  background: msg.sender === "user" ? "#e2e8f0" : "#edf2f7",
                  margin: "8px 0",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  maxWidth: "80%",
                  fontSize: "14px",
                }}
              >
                {msg.text}
              </div>
            ))}
          </div>


          <div
            style={{
              display: "flex",
              borderTop: "1px solid #ccc",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              style={{
                flex: 1,
                border: "none",
                padding: "10px",
                fontSize: "14px",
              }}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              style={{
                background: "#2c7a7b",
                color: "white",
                border: "none",
                padding: "10px 15px",
                cursor: "pointer",
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};


export default Chatbot;
