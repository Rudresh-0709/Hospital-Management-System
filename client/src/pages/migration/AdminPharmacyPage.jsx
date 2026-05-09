import { useEffect, useMemo, useState } from 'react';
import AdminShell from '../../components/migration/AdminShell';
import { getAdminPharmacyOverview } from '../../services/adminApi';
import '../../styles/modern-form-migrate.css';

function AdminPharmacyPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState({ products: [], consumer: [], totalAmounts: [] });
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  useEffect(() => {
    async function load() {
      const response = await getAdminPharmacyOverview();
      if (!response.ok) {
        setError(response.data?.message || 'Failed to load pharmacy overview');
        setLoading(false);
        return;
      }

      setPayload({
        products: response.data.products || [],
        consumer: response.data.consumer || [],
        totalAmounts: response.data.totalAmounts || [],
      });
      setLoading(false);
    }

    load();
  }, []);

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return payload.products;
    return payload.products.filter((p) =>
      String(p.product_name || p.medicine_name || '').toLowerCase().includes(term)
      || String(p.manufacturer || p.category || '').toLowerCase().includes(term)
    );
  }, [payload.products, productSearch]);

  const filteredConsumers = useMemo(() => {
    const term = customerSearch.trim().toLowerCase();
    if (!term) return payload.consumer;
    return payload.consumer.filter((c) =>
      String(c.consumer_name || c.sold_to || '').toLowerCase().includes(term)
      || String(c.medicine_name || '').toLowerCase().includes(term)
    );
  }, [payload.consumer, customerSearch]);

  const totalRevenue = useMemo(() => {
    return payload.totalAmounts.reduce((sum, item) => sum + (parseFloat(item.total_sales) || 0), 0);
  }, [payload.totalAmounts]);

  return (
    <AdminShell title="Pharmacy Admin">
      <div className="modern-form-page">
        <div className="form-main">
          <div className="form-header">
            <div className="form-header-content">
              <h1 className="form-title">Pharmacy Dashboard</h1>
              <p className="form-subtitle">Overview of medicine inventory, sales transactions, and revenue tracking.</p>
            </div>
          </div>

          {loading && <div className="form-alert info"><span className="form-alert-icon">i</span><span>Loading pharmacy dashboard...</span></div>}
          {!loading && error && <div className="form-alert error"><span className="form-alert-icon">!</span><span>{error}</span></div>}

          {!loading && !error && (
            <>
              <section className="form-section">
                <div className="form-section-header"><h3 className="form-section-title">Sales Summary</h3></div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="form-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Total Sales (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payload.totalAmounts.length > 0 ? payload.totalAmounts.map((item, idx) => (
                        <tr key={`${item.date || idx}-${idx}`}>
                          <td>{item.date ? String(item.date).slice(0, 10) : '-'}</td>
                          <td style={{ fontWeight: 700, color: 'var(--form-status-success)' }}>₹{parseFloat(item.total_sales || 0).toFixed(2)}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--form-text-muted)' }}>No sales data available.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="form-section">
                <div className="form-section-header"><h3 className="form-section-title">Recent Customers</h3></div>
                <input
                  className="form-input"
                  placeholder="Search by customer name or medicine..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  style={{ marginBottom: '12px' }}
                />
                <div style={{ overflowX: 'auto' }}>
                  <table className="form-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Type</th>
                        <th>Contact</th>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredConsumers.length > 0 ? filteredConsumers.slice(-8).reverse().map((c, idx) => (
                        <tr key={`${c.transaction_id || idx}-${idx}`}>
                          <td style={{ fontWeight: 600 }}>{c.consumer_name || c.sold_to || '-'}</td>
                          <td>
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              background: c.consumer_type === 'admitted' || c.is_admitted ? '#d1fae5' : '#dbeafe',
                              color: c.consumer_type === 'admitted' || c.is_admitted ? '#0ea05e' : '#1e66d4',
                            }}>
                              {c.consumer_type || (c.is_admitted ? 'Admitted' : 'Walk-in')}
                            </span>
                          </td>
                          <td>{c.contact_number || '-'}</td>
                          <td>{c.medicine_name || c.product_id || '-'}</td>
                          <td>{c.quantity || '-'}</td>
                          <td style={{ fontWeight: 700 }}>₹{parseFloat(c.total_amount || c.total_cost || 0).toFixed(2)}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--form-text-muted)' }}>No transactions found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>

        <aside className="form-aside">
          <section className="form-section">
            <div className="form-section-header"><h3 className="form-section-title">Revenue</h3></div>
            <div className="form-summary-grid">
              <div className="form-summary-card success"><div className="form-summary-label">Total Revenue</div><div className="form-summary-value">₹{totalRevenue.toFixed(0)}</div></div>
              <div className="form-summary-card"><div className="form-summary-label">Products</div><div className="form-summary-value">{payload.products.length}</div></div>
              <div className="form-summary-card secondary"><div className="form-summary-label">Transactions</div><div className="form-summary-value">{payload.consumer.length}</div></div>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section-header"><h3 className="form-section-title">Product Inventory</h3></div>
            <input
              className="form-input"
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />

            {!loading && (
              <div style={{ overflowY: 'auto', marginTop: '12px', maxHeight: '350px' }}>
                <table className="form-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length > 0 ? filteredProducts.map((product, idx) => (
                      <tr key={`${product.product_id || product.medicine_id || idx}-${idx}`}>
                        <td style={{ fontWeight: 600 }}>{product.product_name || product.medicine_name || '-'}</td>
                        <td>₹{parseFloat(product.price_per_unit || 0).toFixed(2)}</td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            background: (product.stock || product.stock_quantity || 0) > 200 ? '#d1fae5' : (product.stock || product.stock_quantity || 0) > 50 ? '#fef3c7' : '#fee2e2',
                            color: (product.stock || product.stock_quantity || 0) > 200 ? '#0ea05e' : (product.stock || product.stock_quantity || 0) > 50 ? '#f59e0b' : '#dc2626',
                          }}>
                            {product.stock || product.stock_quantity || 0}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--form-text-muted)' }}>No products found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </aside>

        <aside className="form-sidebar">
          <div className="form-sidebar-section">
            <div className="form-sidebar-title">Pharmacy</div>
            <div className="form-sidebar-item">💊 Medicine inventory</div>
            <div className="form-sidebar-item">💰 Sales tracking</div>
            <div className="form-sidebar-item">🧾 Transaction log</div>
            <div className="form-sidebar-item">📊 Revenue overview</div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

export default AdminPharmacyPage;
