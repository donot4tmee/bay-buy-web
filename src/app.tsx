import { useEffect, useMemo, useState } from "react";
import { api, type Business, type Product } from "./api.js";

export function App() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

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

  return (
    <main>
      <header>
        <p className="eyebrow">Baybay Local Commerce</p>
        <h1>Baybay Basket</h1>
        <p>Find groceries from verified local businesses in Baybay City.</p>
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
          </article>
        ))}
        {!error && selectedBusiness && filteredProducts.length === 0 && (
          <p>No available products match this search.</p>
        )}
      </section>
    </main>
  );
}
