
export type PagedResponse<T> = {
  success: boolean;
  message: string;
  data: T[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
};

export type ItemMasterRow = {
  id?: string | number;
  code: string;
  name: string;
  img1?: string;
  classcode: string;
  classname: string;
  baseunitcode: string;
  baseunitname: string;
  activedate: string | null;
};

// GetAllItemMasterParams
export type DataPage = {
  area: string;
  pageNumber: number;
  pageSize: number;
  search: string;
};

// export const getPTList = () =>
//   http.get<MasterItem[]>("/api/Auth/GetlistPT");
