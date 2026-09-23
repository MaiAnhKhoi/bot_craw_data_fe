/* Kiểu của module Auth — khớp docs/API_CONTRACT.md §1. */

export interface User {
  id: number;
  username: string;
  full_name: string | null;
  is_active: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}
