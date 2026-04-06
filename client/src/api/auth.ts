import http from "./http";

export interface LoginRequest {
  userid: string;
  password: string;
  userpt: string;
}

export const login = (data: LoginRequest) =>
  http.post("/api/Auth/login", {
    userid: data.userid,
    password: data.password,
    userpt: data.userpt,
  });