// src/hooks/react_query/useFetchLogin.ts
import { useMutation } from "@tanstack/react-query";
import type { ModelDataUserRequest } from "../../Model/LoginModel";
import { postLogin } from "../../service/loginService";

export function useFetchLogin() {
  return useMutation({
    mutationFn: (payload: ModelDataUserRequest) => postLogin(payload),
    onSuccess: (data) => {
      localStorage.setItem("token", data.access_token); // ✅ sesuai API kamu
      localStorage.setItem("userid", data.userid); // simpan userid
      localStorage.setItem("userpt", data.userpt);
    },
  });
}
