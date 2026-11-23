export interface Business {
  uuid: string;
  name: string;
  serviceArea: string;
  verifiedAt: string | null;
}

export interface Product {
  uuid: string;
  businessUuid: string;
  name: string;
  category: string;
  unitLabel: string;
  price: number;
  isAvailable?: boolean;
}

export interface OrderInput {
  businessUuid: string;
  fulfillmentMethod: "pickup" | "delivery";
  deliveryArea?: string;
  privateDeliveryDetails?: string;
  lines: Array<{ productUuid: string; quantity: number }>;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const accessToken = () => window.localStorage.getItem("bb_access_token");

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: accessToken() ? { authorization: `Bearer ${accessToken()}` } : {},
  });
  if (!response.ok) {
    throw new Error("Unable to load marketplace data.");
  }
  const payload = (await response.json()) as { data: T };
  return payload.data;
}

async function post<T>(path: string, data: unknown): Promise<T> {
  const token = accessToken();
  if (!token) throw new Error("Sign in is required to submit an order.");
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const payload = (await response.json()) as { data?: T; error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message ?? "The request failed.");
  return payload.data as T;
}

export const api = {
  listBusinesses: () => get<Business[]>("/v1/businesses"),
  listProducts: (businessUuid: string) =>
    get<Product[]>(`/v1/businesses/${businessUuid}/products`),
  listOrders: () => get<Array<{ uuid: string; status: string; totalAmount: number }>>("/v1/orders"),
  submitOrder: (input: OrderInput) => post("/v1/orders", input),
  report: (input: { targetUuid: string; targetType: "business" | "product"; reason: string }) =>
    post("/v1/reports", input),
};
