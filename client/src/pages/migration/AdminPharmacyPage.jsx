import { useEffect, useMemo, useState } from 'react';
import AdminShell from '../../components/migration/AdminShell';
import { getAdminPharmacyOverview } from '../../services/adminApi';
import '../../styles/pharmacy-dashboard-ejs.css';

function AdminPharmacyPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState({ products: [], consumer: [], totalAmounts: [] });
  const [search, setSearch] = useState('');

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
    const term = search.trim().toLowerCase();
    if (!term) return payload.products;
    return payload.products.filter((p) => String(p.product_name || '').toLowerCase().includes(term));
  }, [payload.products, search]);

  return (
    <AdminShell title="Pharmacy Admin">
      <section className="card pharmacy-card">
        <h3 className="card-title">Sales Summary</h3>
        {loading && <p className="muted">Loading pharmacy dashboard...</p>}
        {!loading && error && <p className="error">{error}</p>}

        {!loading && !error && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Total Sales</th>
                </tr>
              </thead>
              <tbody>
                {payload.totalAmounts.length > 0 ? payload.totalAmounts.map((item, idx) => (
                  <tr key={`${item.date || idx}-${idx}`}>
                    <td>{item.date ? String(item.date).slice(0, 10) : '-'}</td>
                    <td>{item.total_sales ?? 0}</td>
                  </tr>
                )) : <tr><td colSpan={2}>No sales data available.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card pharmacy-card">
        <div className="toolbar">
          <h3 className="card-title card-title-tight">Recently Added Products</h3>
          <input
            className="field field-tight"
            placeholder="Search product"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? filteredProducts.slice(-5).reverse().map((product, idx) => (
                <tr key={`${product.product_id || idx}-${idx}`}>
                  <td>{product.product_name}</td>
                  <td>{product.category}</td>
                  <td>{product.price_per_unit}</td>
                  <td>{product.stock}</td>
                </tr>
              )) : <tr><td colSpan={4}>No products available.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card pharmacy-card">
        <h3 className="card-title">Recent Customers</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Type</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Product ID</th>
                <th>Quantity</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {payload.consumer.length > 0 ? payload.consumer.slice(-5).reverse().map((c, idx) => (
                <tr key={`${c.transaction_id || idx}-${idx}`}>
                  <td>{c.consumer_name}</td>
                  <td>{c.consumer_type}</td>
                  <td>{c.contact_number}</td>
                  <td>{c.email}</td>
                  <td>{c.product_id}</td>
                  <td>{c.quantity}</td>
                  <td>{c.total_amount}</td>
                </tr>
              )) : <tr><td colSpan={7}>No consumer transactions available.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}

export default AdminPharmacyPage;
