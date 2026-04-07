//untuk representasi data dari backend dipakai di service / API response
export interface ModelMasterItem {
  code: string;
  name: string;
  img1: string;
  classcode: string;
  classname: string;
  baseunitcode: string;
  baseunitname: string;
  activedate: string | '1900/1/1';
  iditem : number ;
}

// representasi row untuk UI
export type ItemMasterRow = {
  code: string;
  name: string;
  img1: string;
  classcode: string;
  classname: string;
  baseunitcode: string;
  baseunitname: string;
  activedate: string | null;
  iditem : number ;
};

// export type ItemMasterRow = {
//   id?: string | number;
//   code: string;
//   name: string;
//   img1?: string;
//   classcode: string;
//   classname: string;
//   baseunitcode: string;
//   baseunitname: string;
//   activedate: string | null;
// };