import { useNavigate } from "react-router-dom";
import logo from "../assets/jerseyvault-logo.jpeg";

export default function BrandLogo({ onClick, style = {}, logoSize = "36px", textSize = "24px" }) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) onClick();
    else navigate("/");
  };

  return (
    <div 
      onClick={handleClick} 
      style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: "10px", 
        cursor: "pointer", 
        flexShrink: 0, 
        ...style 
      }}
    >
      <img 
        src={logo} 
        alt="JerseyVault logo" 
        style={{ 
          height: logoSize, 
          width: "auto", 
          
          objectFit: "contain",
          mixBlendMode: "normal",
          filter: "none"
        }} 
      />
      <span 
        style={{ 
          fontFamily: "'Barlow Condensed', sans-serif", 
          fontWeight: 900, 
          fontSize: textSize, 
          letterSpacing: "4px", 
          color: "#fff", 
          display: "flex", 
          alignItems: "center" 
        }}
      >
        JERSEY<span style={{ color: "#39ff14" }}>VAULT</span>
      </span>
    </div>
  );
}
