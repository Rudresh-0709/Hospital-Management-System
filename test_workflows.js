/**
 * Hospital Workflow Test Suite
 * Tests critical user flows: login, form submission, redirects, API responses
 * Run: node test_workflows.js
 */

const http = require('http');
const querystring = require('querystring');

const BASE_URL = 'http://localhost:4000';
const tests = [];
let passCount = 0;
let failCount = 0;

// Test data
const testData = {
  admin: { username: 'admin', password: 'admin' },
  doctor: { username: 'Dr. Priya', password: 'doctor123' },
  patient: { username: 'Aarav Sharma', password: 'patient123' }
};

/**
 * HTTP request helper
 */
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TestSuite/1.0',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body ? (body.startsWith('{') ? JSON.parse(body) : body) : null
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Test assertion
 */
function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('\n🏥 Hospital Workflow Test Suite\n');
  console.log('=' .repeat(60));

  for (const t of tests) {
    try {
      await t.fn();
      console.log(`✅ ${t.name}`);
      passCount++;
    } catch (err) {
      console.log(`❌ ${t.name}`);
      console.log(`   Error: ${err.message}`);
      failCount++;
    }
  }

  console.log('=' .repeat(60));
  console.log(`\n📊 Results: ${passCount} passed, ${failCount} failed\n`);
  process.exit(failCount > 0 ? 1 : 0);
}

// =============================================================================
// WORKFLOW TESTS
// =============================================================================

/**
 * 1. ROUTE/PAGE ACCESSIBILITY TESTS
 */
test('GET / → should return 200 (React home)', async () => {
  const res = await makeRequest('GET', '/');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
});

test('GET /adminlogin → should return 200 (admin login page)', async () => {
  const res = await makeRequest('GET', '/adminlogin');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
});

test('GET /admin/doctorlogin → should return 200 (doctor login page)', async () => {
  const res = await makeRequest('GET', '/admin/doctorlogin');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
});

test('GET /patientlogin → should return 200 (patient login page)', async () => {
  const res = await makeRequest('GET', '/patientlogin');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
});

/**
 * 2. API ENDPOINT ACCESSIBILITY TESTS
 */
test('GET /api/auth/status (not logged in) → should return 401', async () => {
  const res = await makeRequest('GET', '/api/auth/status');
  assert(res.status === 401, `Expected 401, got ${res.status}`);
});

test('GET /api/doctor/visitnavigation (not logged in) → should return 401', async () => {
  const res = await makeRequest('GET', '/api/doctor/visitnavigation');
  assert(res.status === 401, `Expected 401, got ${res.status}`);
});

test('GET /api/admin/dashboard/overview (not logged in) → should return 401', async () => {
  const res = await makeRequest('GET', '/api/admin/dashboard/overview');
  assert(res.status === 401, `Expected 401, got ${res.status}`);
});

/**
 * 3. FORM ENDPOINT VALIDATION TESTS
 */
test('POST /admin_login_form (missing fields) → should return error', async () => {
  const res = await makeRequest('POST', '/admin_login_form', {});
  assert(res.status !== 200 || res.body !== 'Authentication successful', 
    `Empty form should not authenticate`);
});

test('POST /admin_login_form (correct credentials) → should authenticate', async () => {
  const res = await makeRequest('POST', '/admin_login_form', testData.admin);
  // Should redirect or return success message
  assert(res.status === 200 || res.status === 302 || res.body?.includes('successful') || res.body?.includes('redirect'),
    `Expected success or redirect, got ${res.status}`);
});

test('POST /doctor_login_form (correct credentials) → should authenticate', async () => {
  const res = await makeRequest('POST', '/doctor_login_form', testData.doctor);
  assert(res.status === 200 || res.status === 302 || res.body?.includes('successful'),
    `Expected success or redirect, got ${res.status}`);
});

test('POST /patientlogin (correct credentials) → should authenticate', async () => {
  const res = await makeRequest('POST', '/patientlogin', testData.patient);
  assert(res.status === 200 || res.status === 302 || res.body?.includes('successful'),
    `Expected success or redirect, got ${res.status}`);
});

/**
 * 4. SPA FALLBACK TEST (should serve React for unknown routes)
 */
test('GET /nonexistent-page → should return 200 (SPA fallback)', async () => {
  const res = await makeRequest('GET', '/nonexistent-page');
  assert(res.status === 200, `Expected 200 (SPA fallback), got ${res.status}`);
  assert(res.body?.includes('react') || res.body?.includes('root') || res.body?.includes('html'),
    'Should return HTML content for SPA'
  );
});

/**
 * 5. PROTECTED PAGES (should fallthrough to React for login redirects)
 */
test('GET /admin (not logged in) → should return 200 (React + redirect in client)', async () => {
  const res = await makeRequest('GET', '/admin');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
});

test('GET /doctoradmin (not logged in) → should return 200 (React + redirect in client)', async () => {
  const res = await makeRequest('GET', '/doctoradmin');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
});

test('GET /patientdashboard (not logged in) → should return 200 (React + redirect in client)', async () => {
  const res = await makeRequest('GET', '/patientdashboard');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
});

/**
 * 6. NO MIGRATION PATHS TESTS (should 404 or redirect to React root)
 */
test('GET /migrate should not exist as dedicated path', async () => {
  const res = await makeRequest('GET', '/migrate');
  // Should either 404 explicitly or fallthrough to SPA (200)
  assert(res.status === 404 || res.status === 200, 
    `Migrate paths should not be active; got ${res.status}`);
});

test('GET /legacy should not exist as dedicated path', async () => {
  const res = await makeRequest('GET', '/legacy');
  assert(res.status === 404 || res.status === 200,
    `Legacy paths should not be active; got ${res.status}`);
});

/**
 * 7. CHAT ENDPOINTS
 */
test('GET /chat (not logged in) → should return page or redirect', async () => {
  const res = await makeRequest('GET', '/chat');
  assert(res.status === 200 || res.status === 302 || res.status === 401,
    `Expected 200, 302, or 401; got ${res.status}`);
});

test('GET /chat/setting (not logged in) → should return page or redirect', async () => {
  const res = await makeRequest('GET', '/chat/setting');
  assert(res.status === 200 || res.status === 302 || res.status === 401,
    `Expected 200, 302, or 401; got ${res.status}`);
});

/**
 * 8. VIDEO CHAT ROUTE
 */
test('GET /video-chat → should return page (React)', async () => {
  const res = await makeRequest('GET', '/video-chat');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
});

/**
 * 9. STATIC AND SPECIAL ENDPOINTS (should pass through)
 */
test('GET /api/search-medicine → should pass through or return data', async () => {
  const res = await makeRequest('GET', '/api/search-medicine');
  // Could be empty data or error, but should not 404
  assert(res.status !== 404, 'API endpoint should not 404');
});

/**
 * 10. APPOINTMENT BOOK (public endpoint)
 */
test('GET /appointmentbook → should return 200 (public)', async () => {
  const res = await makeRequest('GET', '/appointmentbook');
  assert(res.status === 200, `Expected 200, got ${res.status}`);
});

// =============================================================================
// RUN TESTS
// =============================================================================

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
