
import React from 'react';
import GuideLayout from '../../components/GuideLayout';

export default function ShippingGuide() {
  return (
    <GuideLayout
      title="Shipping and Delivery Policy"
      metaDescription="Details on Jersey Vault's shipping timelines, Cash on Delivery (COD) availability, and order tracking across India."
      canonicalUrl="https://www.thejerseyvault.in/pages/shipping-guide"
      h1="Shipping & Delivery Information"
    >
      <p>We know you are excited to receive your new kit. We partner with India's most reliable courier services (BlueDart, Delhivery, ExpressBees) to ensure your jersey reaches you safely and quickly.</p>
      <h2>Standard Delivery Timelines</h2>
      <ul>
        <li><strong>Metro Cities (Mumbai, Delhi, Bangalore, Chennai, Kolkata):</strong> 3-5 business days.</li>
        <li><strong>Tier 2 & 3 Cities:</strong> 5-7 business days.</li>
        <li><strong>North East & J&K:</strong> 7-10 business days.</li>
      </ul>
      <h2>Cash on Delivery (COD)</h2>
      <p>We proudly offer Cash on Delivery across 95% of Indian pincodes. A nominal convenience fee may apply to COD orders. To ensure seamless delivery, please keep the exact cash ready when the delivery executive arrives.</p>
      <h2>Customized Jerseys</h2>
      <p>If you ordered a jersey with a custom name and number, please allow an additional 24-48 hours for processing. Custom printing requires precision heat-pressing in our warehouse before dispatch.</p>
    </GuideLayout>
  );
}
