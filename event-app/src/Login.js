import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username && password) {
      navigate("/clubs");
    } else {
      alert("Enter username and password");
    }
  };

  return (
    <>
      <main className="page">
        <div className="card">
          <h1 className="title">Login</h1>
          <form className="form" onSubmit={handleLogin}>
            <div className="field">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn">
              Login
            </button>
          </form>
        </div>
      </main>

      <style>{`
        /* full gradient background */


        /* card */
        .card {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.2);
          width: 320px;
          text-align: center;
        }

        .title {
          margin-bottom: 1.5rem;
          color: #333;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .field {
          text-align: left;
          display: flex;
          flex-direction: column;
        }

        .field label {
          margin-bottom: 6px;
          font-weight: 600;
          font-size: 14px;
          color: #333;
        }

        .field input {
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 14px;
        }

        .btn {
          margin-top: 1rem;
          padding: 10px;
          border: none;
          border-radius: 6px;
          background: linear-gradient(135deg, #6a11cb, #2575fc);
          color: white;
          font-size: 16px;
          cursor: pointer;
          transition: 0.3s;
        }

        .btn:hover {
          opacity: 0.9;
          transform: translateY(-2px);
        }
      `}</style>
    </>
  );
}
