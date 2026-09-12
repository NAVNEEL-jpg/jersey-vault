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
        .brand-logo-img { height: ${logoSize || "36px"}; width: auto; object-fit: contain; }
        .brand-logo-text { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: ${textSize || "20px"}; letter-spacing: 1.5px; color: #fff; display: flex; align-items: center; }
        @media (max-width: 440px) {
          .brand-logo-container { gap: 4px !important; }
          .brand-logo-img { height: ${logoSize ? `calc(${logoSize} * 0.85)` : "30px"}; }
          .brand-logo-text { font-size: ${textSize ? `calc(${textSize} * 0.85)` : "17px"}; letter-spacing: 1px; }
        }
        @media (max-width: 360px) {
          .brand-logo-img { height: 26px; }
          .brand-logo-text { font-size: 15px; letter-spacing: 0.5px; }
        }
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
