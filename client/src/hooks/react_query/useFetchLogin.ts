import { useMutation } from "@tanstack/react-query";
import type { ModelDataUserRequest } from "../../Model/LoginModel";
import { postLogin } from "../../service/loginService";
import { decodeJwt } from "../../utils/jwt";

export function useFetchLogin() {
  return useMutation({
    mutationFn: (payload: ModelDataUserRequest) => postLogin(payload),
    onSuccess: (data) => {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("userid", data.userid);
      localStorage.setItem("userpt", data.userpt);

      const claims = decodeJwt(data.access_token);
      const rawForce =
        claims?.gantiKunci ??
        claims?.GantiKunci ??
        claims?.mustChangePassword;
      const mustChange =
        String(rawForce ?? "0") === "1" ||
        String(rawForce ?? "").toLowerCase() === "true";

      localStorage.setItem("forceChangePassword", mustChange ? "1" : "0");
    },
  });
}
