import React from 'react';
import GuideLayout from '../../components/GuideLayout';

export default function Vision() {
  return (
    <GuideLayout
      title="Vision | Jersey Vault"
      metaDescription="Our vision for the future of football apparel in India."
      canonicalUrl="https://www.thejerseyvault.in/pages/vision"
      h1="Vision"
    >
      <div className="eeat-content" style={{ fontSize: '16px', lineHeight: 1.8, color: '#ddd' }}>
        <p style={{ marginBottom: '20px' }}>
          Our vision for the future of football apparel in India. At Jersey Vault, we prioritize authenticity, customer satisfaction, and an undying love for the beautiful game.
        </p>
        <h2 style={{ color: '#39ff14', marginTop: '30px', marginBottom: '15px', fontSize: '24px', textTransform: 'uppercase', fontFamily: "'Barlow Condensed', sans-serif" }}>
          Our Commitment
        </h2>
        <p style={{ marginBottom: '20px' }}>
          Every product we dispatch undergoes a rigorous multi-point quality check at our fulfillment center. We ensure that stitching, fabric technology (such as Dri-FIT or Heat.RDY), and badge application meet the highest standards. We never compromise on quality because we are fans ourselves.
        </p>
        <h2 style={{ color: '#39ff14', marginTop: '30px', marginBottom: '15px', fontSize: '24px', textTransform: 'uppercase', fontFamily: "'Barlow Condensed', sans-serif" }}>
          The Jersey Vault Difference
        </h2>
        <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginBottom: '30px' }}>
          <li style={{ marginBottom: '10px' }}><strong>Premium Quality:</strong> We source only top-tier materials.</li>
          <li style={{ marginBottom: '10px' }}><strong>Fast Delivery:</strong> Reliable shipping across India with COD.</li>
          <li style={{ marginBottom: '10px' }}><strong>Dedicated Support:</strong> Real humans ready to help you with sizing or order issues.</li>
        </ul>
        <div style={{ marginTop: '40px', padding: '20px', background: '#111', borderLeft: '4px solid #39ff14', borderRadius: '4px' }}>
          <h3 style={{ color: '#fff', margin: '0 0 10px 0', fontSize: '18px' }}>Need assistance?</h3>
          <p style={{ margin: 0, color: '#aaa' }}>Reach out to us via our <a href="/contact" style={{ color: '#39ff14' }}>Contact Page</a> or drop us a message on WhatsApp. We are here 24/7 for you.</p>
        </div>
      </div>
    </GuideLayout>
  );
}
