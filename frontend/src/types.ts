export type Product = {
  id: number;
  name: string;
  price: number;
  store_id: number;
  store: {
    id: number;
    name: string;
  }
  embedding: number[] | null;
};
