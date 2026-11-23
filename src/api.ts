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

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);
  if (!response.ok) {
    throw new Error("Unable to load marketplace data.");
  }
  const payload = (await response.json()) as { data: T };
  return payload.data;
}

export const api = {
  listBusinesses: () => get<Business[]>("/v1/businesses"),
  listProducts: (businessUuid: string) =>
    get<Product[]>(`/v1/businesses/${businessUuid}/products`),
};
