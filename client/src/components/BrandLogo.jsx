import { useNavigate } from "react-router-dom";
import logo from "../assets/jerseyvault-logo.jpeg";

export default function BrandLogo({ onClick, style = {}, logoSize, textSize }) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) onClick();
    else navigate("/");
  };

  return (
    <div 
      onClick={handleClick} 
      className="brand-logo-container"
      style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: "6px", 
        cursor: "pointer", 
        flexShrink: 0, 
        ...style 
      }}
    >
      <style>{`
        .brand-logo-img { height: ${logoSize || "38px"}; width: auto; object-fit: contain; }
        .brand-logo-text { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: ${textSize || "21px"}; letter-spacing: 2px; color: #fff; display: flex; align-items: center; }
        @media (min-width: 520px) {
          .brand-logo-img { height: ${logoSize || "44px"}; }
          .brand-logo-text { font-size: ${textSize || "25px"}; letter-spacing: 3px; }
        }
      `}</style>
      <img 
        src={logo} 
        alt="JerseyVault logo" 
        className="brand-logo-img"
      />
      <span className="brand-logo-text">
        JERSEY<span style={{ color: "#39ff14" }}>VAULT</span>
      </span>
    </div>
  );
}
