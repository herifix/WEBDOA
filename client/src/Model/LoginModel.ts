export interface ModelDataUserRequest {
  userid: string;      
  password: string;     
  userpt: string;      
}

export type ModelDataUserResponse = {
  access_token: string;
  userid: string;
  password: string;     
  userpt: string;      
  gantiKunci?: boolean | string | number;
};
