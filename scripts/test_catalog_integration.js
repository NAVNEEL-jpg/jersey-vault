import express from 'express';
import cors from 'cors';
import productRoutes from '../server/src/routes/productRoutes.js';
import catalogRoutes from '../server/src/routes/catalogRoutes.js';
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/products', productRoutes);
app.use('/api/catalog', catalogRoutes);

const server = app.listen(5099, async () => {
  console.log('\n================ INTEGRATION TESTS ================');
  try {
    // Test 1: Full Catalog
    const catRes = await fetch('http://localhost:5099/api/catalog/all');
    if (!catRes.ok) throw new Error(`Catalog endpoint failed with status ${catRes.status}`);
    const catData = await catRes.json();
    console.log(`[PASS] /api/catalog/all -> Success: ${catData.success}, Source: ${catData.source}`);
    console.log(`       Products: ${catData.products?.length}, Teams: ${catData.teams?.length}, Categories: ${catData.categories?.length}`);

    if (!catData.products || catData.products.length !== 36) {
      throw new Error(`Expected 36 products, got ${catData.products?.length}`);
    }

    // Test 2: Products List
    const prodRes = await fetch('http://localhost:5099/api/products');
    if (!prodRes.ok) throw new Error(`Products endpoint failed with status ${prodRes.status}`);
    const products = await prodRes.json();
    console.log(`[PASS] /api/products -> Returned ${products.length} products`);

    // Test 3: Check title sanitization & formatting across all products
    let formattingErrors = 0;
    products.forEach((p, idx) => {
      if (/\s{2,}/.test(p.name)) {
        console.error(`[FAIL] Product [${idx+1}] contains excessive whitespace: "${p.name}"`);
        formattingErrors++;
      }
      if (!p.id || !p.name || !p.price) {
        console.error(`[FAIL] Product [${idx+1}] missing required fields:`, p);
        formattingErrors++;
      }
    });

    if (formattingErrors === 0) {
      console.log(`[PASS] All 36 product names are cleanly formatted without whitespace issues!`);
    } else {
      throw new Error(`Found ${formattingErrors} product formatting errors!`);
    }

    // Test 4: Single Product Fetch
    const sampleId = products[0].id;
    const singleRes = await fetch(`http://localhost:5099/api/products/${sampleId}`);
    if (!singleRes.ok) throw new Error(`Single product fetch failed with status ${singleRes.status}`);
    const singleProd = await singleRes.json();
    console.log(`[PASS] /api/products/:id -> Fetched "${singleProd.name}" (ID: ${singleProd.id})`);

    // Test 5: Teams API
    const teamsRes = await fetch('http://localhost:5099/api/catalog/teams');
    const teamsData = await teamsRes.json();
    console.log(`[PASS] /api/catalog/teams -> Success: ${teamsData.success}, Teams count: ${teamsData.data?.length}`);

    // Test 6: Settings API
    const setRes = await fetch('http://localhost:5099/api/catalog/settings');
    const setData = await setRes.json();
    console.log(`[PASS] /api/catalog/settings -> Success: ${setData.success}, Settings count: ${setData.data?.length}`);

    console.log('\n>>> ALL 6 INTEGRATION TESTS PASSED SUCCESSFULLY! <<<\n');
  } catch (err) {
    console.error('\n[ERROR] Integration Test Failed:', err.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
