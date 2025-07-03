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

export type Cart = {
  id: number;
  user_id: number;
  created_at: Date;
  store_id: number;
  active: boolean;
  store: {
    name: string;
  };
  total: number;
  items: {
    id: number;
    name: string;
    price: number;
    quantity: number;
  }[];
};


export type ChatSession = {
  id: number;
  user_id: number;
  created_at: string;
  messages: ChatMessage[];
};

export type ChatMessage = {
  id: number;
  chat_session_id: number;
  content: string;
  sender: string;
  openai_message_id: string | null;
  created_at: string;
  message_type?: "suggest_carts_result" | "text";
};
export type ChatMessageAction = {
  id: number;
  chat_message_id: number;
  action_type: "suggest_carts";
  payload: {
    input: string;
  };
  created_at: string;
  confirmed_at: string | null;
  executed_at: string | null;
};

export type ChatMessagePopulated = ChatMessage & {
  action: ChatMessageAction | null;
  carts?: {
    id: number;
    score: number;
    store_id: number;
    store_name: string;
    total: number;
    products: { id: number; name: string; quantity: number }[];
  }[];
};

export type ChatSessionPopulated = Omit<ChatSession, "messages"> & {
  messages: ChatMessagePopulated[];
};