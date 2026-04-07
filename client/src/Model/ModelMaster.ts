
export type PagedResponse<T> = {
  success: boolean;
  message: string;
  data: T[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
};


// GetAllItemMasterParams
export type DataPage = {
  pageNumber: number;
  pageSize: number;
  search: string;
};

// export const getPTList = () =>
//   http.get<MasterItem[]>("/api/Auth/GetlistPT");
