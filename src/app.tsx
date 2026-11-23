import { useEffect, useMemo, useState } from "react";
import { api, type Business, type Product } from "./api.js";
import { restoreSession, signInWithGoogle, signOut } from "./auth.js";

export function App() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [basket, setBasket] = useState<Record<string, number>>({});
  const [fulfillmentMethod, setFulfillmentMethod] = useState<"pickup" | "delivery">("pickup");
  const [deliveryArea, setDeliveryArea] = useState("");
  const [privateDeliveryDetails, setPrivateDeliveryDetails] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<Product | null>(null);
  const [orders, setOrders] = useState<Array<{ uuid: string; status: string; totalAmount: number }>>([]);
  const [role, setRole] = useState<string | null>(
    window.localStorage.getItem("bb_role"),
  );
  const [businessName, setBusinessName] = useState("");
  const [businessArea, setBusinessArea] = useState("");
  const [productName, setProductName] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productUnit, setProductUnit] = useState("");
  const [productPrice, setProductPrice] = useState("0");
  const [reports, setReports] = useState<Array<{ uuid: string; targetUuid: string; targetType: string; reason: string; status: string }>>([]);
  const [categories, setCategories] = useState<Array<{ uuid: string; name: string }>>([]);
  const [categoryName, setCategoryName] = useState("");
  const [analytics, setAnalytics] = useState<Array<{ name: string; count: number }>>([]);
  const [retentionDays, setRetentionDays] = useState("365");
  const [configuration, setConfiguration] = useState("");

  useEffect(() => {
    void api
      .listBusinesses()
      .then((items) => {
        setBusinesses(items);
        if (items[0]) setSelectedBusiness(items[0].uuid);
      })
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Unable to load stores."),
      );
  }, []);

  useEffect(() => {
    void restoreSession().then(setRole);
  }, []);

  useEffect(() => {
    if (!selectedBusiness) return;
    void api
      .listProducts(selectedBusiness)
      .then(setProducts)
      .catch(() => setError("Unable to load products."));
  }, [selectedBusiness]);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) =>
        `${product.name} ${product.category}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [products, search],
  );
  const basketLines = Object.entries(basket)
    .filter(([, quantity]) => quantity > 0)
    .map(([productUuid, quantity]) => ({ productUuid, quantity }));

  const addToBasket = (productUuid: string) => {
    setBasket((current) => ({
      ...current,
      [productUuid]: (current[productUuid] ?? 0) + 1,
    }));
    setSubmitted(null);
  };

  const submitOrder = async () => {
    try {
      setError(null);
      const result = (await api.submitOrder({
        businessUuid: selectedBusiness,
        fulfillmentMethod,
        ...(fulfillmentMethod === "delivery"
          ? { deliveryArea, privateDeliveryDetails }
          : {}),
        lines: basketLines,
      })) as { uuid: string };
      setBasket({});
      setSubmitted(`Order ${result.uuid} submitted.`);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Unable to submit order.");
    }
  };

  const submitReport = async () => {
    if (!reportTarget) return;
    try {
      await api.report({
        targetUuid: reportTarget.uuid,
        targetType: "product",
        reason: "Please review this listing.",
      });
      setReportTarget(null);
      setSubmitted("Report submitted for administrator review.");
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Unable to submit report.");
    }
  };

  const loadOrders = async () => {
    try {
      setError(null);
      setOrders(await api.listOrders());
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Unable to load orders.");
    }
  };

  const saveBusiness = async () => {
    if (!selectedBusiness) return;
    try {
      await api.updateBusiness(selectedBusiness, {
        name: businessName,
        serviceArea: businessArea,
      });
      setSubmitted("Business profile updated.");
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Unable to update the business.");
    }
  };

  const createProduct = async () => {
    if (!selectedBusiness) return;
    try {
      await api.createProduct(selectedBusiness, {
        name: productName,
        category: productCategory,
        unitLabel: productUnit,
        price: Number(productPrice),
        isAvailable: true,
      });
      setProducts(await api.listProducts(selectedBusiness));
      setSubmitted("Product created.");
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Unable to create the product.");
    }
  };

  const loadAdminData = async () => {
    try {
      setReports(await api.listReports());
      setCategories(await api.listCategories());
      setAnalytics(await api.categoryAnalytics());
      setConfiguration(JSON.stringify(await api.listConfiguration()));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Unable to load administrator data.");
    }
  };

  return (
    <main>
      <header>
        <p className="eyebrow">Baybay Local Commerce</p>
        <h1>Baybay Basket</h1>
        <p>Find groceries from verified local businesses in Baybay City.</p>
        {role ? (
          <button onClick={() => void signOut().then(() => setRole(null))}>Sign out</button>
        ) : (
          <button onClick={() => void signInWithGoogle()}>Sign in with Google</button>
        )}
      </header>
      {error && <p className="error">{error}</p>}
      <section className="toolbar" aria-label="Marketplace filters">
        <label>
          Store
          <select
            value={selectedBusiness}
            onChange={(event) => setSelectedBusiness(event.target.value)}
          >
            {businesses.map((business) => (
              <option value={business.uuid} key={business.uuid}>
                {business.name} · {business.serviceArea}
              </option>
            ))}
          </select>
        </label>
        <label>
          Search products
          <input value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
      </section>
      <section className="grid" aria-live="polite">
        {filteredProducts.map((product) => (
          <article className="card" key={product.uuid}>
            <h2>{product.name}</h2>
            <p>{product.category} · {product.unitLabel}</p>
            <strong>PHP {product.price.toFixed(2)}</strong>
            <div className="card-actions">
              <button onClick={() => addToBasket(product.uuid)}>Add to basket</button>
              <button className="quiet" onClick={() => setReportTarget(product)}>Report</button>
            </div>
          </article>
        ))}
        {!error && selectedBusiness && filteredProducts.length === 0 && (
          <p>No available products match this search.</p>
        )}
      </section>
      <section className="basket">
        <h2>Basket</h2>
        <p>{basketLines.reduce((total, line) => total + line.quantity, 0)} item(s)</p>
        <label>
          Fulfillment
          <select
            value={fulfillmentMethod}
            onChange={(event) =>
              setFulfillmentMethod(event.target.value as "pickup" | "delivery")
            }
          >
            <option value="pickup">Pickup</option>
            <option value="delivery">Delivery</option>
          </select>
        </label>
        {fulfillmentMethod === "delivery" && (
          <>
            <label>
              Delivery area
              <input value={deliveryArea} onChange={(event) => setDeliveryArea(event.target.value)} />
            </label>
            <label>
              Private delivery details
              <input
                value={privateDeliveryDetails}
                onChange={(event) => setPrivateDeliveryDetails(event.target.value)}
              />
            </label>
          </>
        )}
        <button disabled={basketLines.length === 0} onClick={() => void submitOrder()}>
          Submit order
        </button>
        {submitted && <p className="success">{submitted}</p>}
      </section>
      <section className="basket">
        <h2>My orders</h2>
        <button onClick={() => void loadOrders()}>Refresh order status</button>
        {orders.map((order) => (
          <p key={order.uuid}>
            {order.uuid}: {order.status} · PHP {order.totalAmount.toFixed(2)}
          </p>
        ))}
      </section>
      {reportTarget && (
        <div className="dialog">
          <p>Report {reportTarget.name} for administrator review?</p>
          <button onClick={() => void submitReport()}>Submit report</button>
          <button className="quiet" onClick={() => setReportTarget(null)}>Cancel</button>
        </div>
      )}
      {(role === "business" || role === "platform_admin" || role === "system_admin") && (
        <section className="basket">
          <h2>Business management</h2>
          <label>
            Store name
            <input value={businessName} onChange={(event) => setBusinessName(event.target.value)} />
          </label>
          <label>
            Service area
            <input value={businessArea} onChange={(event) => setBusinessArea(event.target.value)} />
          </label>
          <button onClick={() => void saveBusiness()}>Save profile</button>
          <h3>Add product</h3>
          <label>Name<input value={productName} onChange={(event) => setProductName(event.target.value)} /></label>
          <label>Category<input value={productCategory} onChange={(event) => setProductCategory(event.target.value)} /></label>
          <label>Unit<input value={productUnit} onChange={(event) => setProductUnit(event.target.value)} /></label>
          <label>Price<input type="number" min="0" value={productPrice} onChange={(event) => setProductPrice(event.target.value)} /></label>
          <button onClick={() => void createProduct()}>Create product</button>
        </section>
      )}
      {(role === "platform_admin" || role === "system_admin") && (
        <section className="basket">
          <h2>Administration</h2>
          <button onClick={() => void loadAdminData()}>Load moderation and analytics</button>
          <button onClick={() => {
            if (selectedBusiness) void api.verifyBusiness(selectedBusiness).then(() => setSubmitted("Business verified."));
          }}>Verify selected business</button>
          <h3>Reports</h3>
          {reports.map((report) => (
            <p key={report.uuid}>
              {report.targetType}: {report.reason} ({report.status})
              <button onClick={() => void api.updateReportStatus(report.uuid, "resolved").then(loadAdminData)}>Resolve</button>
            </p>
          ))}
          <h3>Categories</h3>
          {categories.map((category) => <p key={category.uuid}>{category.name}</p>)}
          <label>
            New category
            <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
          </label>
          <button onClick={() => void api.createCategory(categoryName).then(loadAdminData)}>Create category</button>
          <h3>Thresholded analytics</h3>
          {analytics.map((item) => <p key={item.name}>{item.name}: {item.count}</p>)}
        </section>
      )}
      {role === "system_admin" && (
        <section className="basket">
          <h2>System configuration and retention</h2>
          <p>{configuration}</p>
          <label>
            Retention days
            <input type="number" min="30" value={retentionDays} onChange={(event) => setRetentionDays(event.target.value)} />
          </label>
          <button onClick={() => void api.runRetention(Number(retentionDays))}>Run retention</button>
          <button onClick={() => void api.backup().then((value) => setSubmitted(JSON.stringify(value)))}>Generate backup snapshot</button>
        </section>
      )}
    </main>
  );
}
