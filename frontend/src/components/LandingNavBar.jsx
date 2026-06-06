import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LandingNavBar() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="landing-navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <img src="/logo.svg" alt="Vendex Logo" className="navbar-logo-img" />
          <span>Vendex</span>
        </Link>

        {/* Navigation Links */}
        <div className="navbar-menu">
          <button 
            className="navbar-link"
            onClick={() => scrollToSection('benefits')}
          >
            Benefits
          </button>
          <button 
            className="navbar-link"
            onClick={() => scrollToSection('process')}
          >
            How It Works
          </button>
          <button 
            className="navbar-link"
            onClick={() => scrollToSection('features')}
          >
            Features
          </button>
        </div>

        {/* Auth Links & Theme Toggle */}
        <div className="navbar-actions">
          <button 
            className="navbar-theme-toggle"
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle dark mode"
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {user && (
            <Link to="/dashboard" className="btn btn-primary btn-sm">
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
