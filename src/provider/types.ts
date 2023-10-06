export type ProviderTransport = WindowTransport | PortTransport;

export type WindowResponseEvent = {
  origin: string;
  source: unknown;
  data: { id: string; target: string; result: unknown };
};
export type RPCRequest = {
  method: string;
  params: Array<unknown>; // This typing is required by ethers.js but is not EIP-1193 compatible
};

export type WindowRequestEvent = {
  id: string;
  target: unknown;
  request: RPCRequest;
};

export type WindowListener = (event: WindowResponseEvent) => void;

export type PortListenerFn = (callback: unknown, ...params: unknown[]) => void;

export type PortListener = (listener: PortListenerFn) => void;

export type WindowTransport = {
  postMessage: (data: WindowRequestEvent) => void;
  addEventListener: (listener: WindowListener) => void;
  removeEventListener: (listener: WindowListener) => void;
  origin: string;
};

export type PortTransport = {
  postMessage: (data: unknown) => void;
  addEventListener: PortListener;
  removeEventListener: PortListener;
  origin: string;
};
