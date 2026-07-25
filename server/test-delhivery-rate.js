import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });
dotenv.config();

import { calculateLiveDeliveryRate, calculateDelhiveryRate } from './src/services/delhivery.service.js';

async function runStandardShippingTest() {
  console.log('================================================================');
  console.log('  STANDARD SHIPPING VERIFICATION (PREPAID ₹99, COD ₹149)        ');
  console.log('================================================================\n');

  // TEST 1: Prepaid Shipping Fee (subtotal <= ₹1099)
  console.log('--- TEST 1: Prepaid Shipping (Cart Subtotal ₹500 <= ₹1099) ---');
  const res1 = await calculateDelhiveryRate({ destinationPincode: '400001', paymentMode: 'PREPAID', subtotal: 500 });
  console.log(`Subtotal: ₹500 | Payment: Prepaid | Fee: ₹${res1.shippingFee}`);
  console.log(`Validation: ${res1.shippingFee === 99 ? 'PASS (Prepaid ₹99 applied)' : 'FAIL'}\n`);

  // TEST 2: COD Shipping Fee (subtotal <= ₹1099)
  console.log('--- TEST 2: COD Shipping (Cart Subtotal ₹500 <= ₹1099) ---');
  const res2 = await calculateDelhiveryRate({ destinationPincode: '400001', paymentMode: 'COD', subtotal: 500 });
  console.log(`Subtotal: ₹500 | Payment: COD | Fee: ₹${res2.shippingFee}`);
  console.log(`Validation: ${res2.shippingFee === 149 ? 'PASS (COD ₹149 applied)' : 'FAIL'}\n`);

  // TEST 3: Free Shipping (subtotal > ₹1099)
  console.log('--- TEST 3: Free Shipping Threshold (Cart Subtotal ₹1200 > ₹1099) ---');
  const res3 = await calculateDelhiveryRate({ destinationPincode: '400001', paymentMode: 'PREPAID', subtotal: 1200 });
  console.log(`Subtotal: ₹1200 | Fee: ₹${res3.shippingFee} | Free Shipping Flag: ${res3.freeShippingApplied ? 'YES' : 'NO'}`);
  console.log(`Validation: ${res3.shippingFee === 0 && res3.freeShippingApplied ? 'PASS (Free Shipping ₹0 applied)' : 'FAIL'}\n`);

  console.log('================================================================');
  console.log('       STANDARD SHIPPING TEST SUITE COMPLETED                   ');
  console.log('================================================================');
}

runStandardShippingTest();
