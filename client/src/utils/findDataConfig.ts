import type { JenisPencarian } from "../Model/ModelFindData";

type FindDataConfigItem = {
  url: string;
  method?: "GET" | "POST";
  Area?: boolean;
  keywordParam?: string;
};

export const findDataConfig: Record<JenisPencarian, FindDataConfigItem> = {
  "item": {
    url: "/api/Master/Item/GetAll",
    method: "GET",
    Area: true,  
    
  },
  "data-item": {
    url: "/api/Master/Item/GetAll",
    method: "GET",
    Area: true,  
    
  },
  "customer": {
    url: "/api/Master/Customer/GetDataByName",
    method: "GET",
    Area: true,
  },
  "supplier": {
    url: "/api/Master/Supplier/GetDataByName",
    method: "GET",
    Area: true,
  },
  "warehouse": {
    url: "/api/Master/Warehouse/GetDataByName",
    method: "GET",
    Area: true,
  },
  "class": {
    url: "/api/Master/Class/GetAll",
    method: "GET",
    Area: true,
  },
  "baseunit": {
    url: "/api/Master/BaseUnit/GetAll",
    method: "GET",
    Area: true,
  },
  "grup": {
    url: "/api/Master/Grup/GetAll",
    method: "GET",
    Area: true,
  },
};