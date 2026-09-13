import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const items = [
    { to: "/listings", label: "Listings" },
    { to: "/rentals", label: "Rentals" },
    { to: "/projects", label: "Projects" },
    { to: "/saved", label: "Saved" },
    { to: "/insights", label: "Insights" },
  ];

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <nav className="navbar">
      <NavLink className="brand" to="/listings">
        Ivy Homes
      </NavLink>

      <ul className="nav-links">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink className="nav-link" to={item.to}>
              {item.label}
            </NavLink>
          </li>
        ))}

        {isAuthenticated && (
          <li>
            <button className="logout-link" onClick={handleLogout}>
              Logout
            </button>
          </li>
        )}
      </ul>

      <div className="nav-user">
        {isAuthenticated && user?.email ? (
          <span className="user-email">{user.email}</span>
        ) : (
          <NavLink className="login-link" to="/login">
            Login
          </NavLink>
        )}
      </div>
    </nav>
  );
}
