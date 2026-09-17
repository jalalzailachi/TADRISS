export type ActionResponse<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
  message?: string;
  [key: string]: unknown;
};
