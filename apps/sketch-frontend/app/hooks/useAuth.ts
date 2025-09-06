import { API_BASE } from "@/utils/urls";
import axios from "axios";
import { useState } from "react";

export interface SignInDTO {
  email: string;
  password: string;
}

export interface SignUpDTO {
  name: string;
  email: string;
  password: string;
}

export const useAuth = ({ email, password }: SignInDTO) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (dto: SignInDTO) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE}/auth/signin`, dto);
      console.log(response);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (dto: SignUpDTO) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE}/auth/signup`, dto);
      console.log(response);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return { signIn, signUp, loading, error };
};
