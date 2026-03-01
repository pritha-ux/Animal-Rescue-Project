import { useState } from "react";
import "../styles/Login.css";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();

    const savedUser = JSON.parse(localStorage.getItem(`user_${username}`));
    if (!savedUser) {
      alert("No user found. Please register first.");
      return;
    }

    if (password === savedUser.password) {
      // save session info
      localStorage.setItem("isLoggedIn", true);
      localStorage.setItem("username", username);
      localStorage.setItem("role", savedUser.role);

      alert("Login successful!");

      // redirect based on role
      switch (savedUser.role) {
        case "admin":
          navigate("/admin-dashboard");
          break;
        case "volunteer":
          navigate("/volunteer-dashboard");
          break;
        case "vet":
          navigate("/vet-dashboard");
          break;
        case "shelter":
          navigate("/shelter-dashboard");
          break;
        default:
          navigate("/home"); // normal reporter
      }
    } else {
      alert("Invalid username or password");
    }
  };

  return (
    <div className="login-container">
      <form className="login-box" onSubmit={handleLogin}>
        <h2>🐾 Animal Rescue System</h2>

        <label>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <label>Password</label>
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span onClick={() => setShowPassword(!showPassword)}>👁</span>
        </div>

        <button type="submit">Login</button>

        <p className="link-text">
          Don’t have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;