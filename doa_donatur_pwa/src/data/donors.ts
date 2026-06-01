export type Donor = {
  id: string;
  apiId?: number;
  idTRBirthdayPray?: number | null;
  name: string;
  phone: string;
  birthday: string;
  hasVoice?: boolean;
};

export const mockDonors: Donor[] = [
  {
    id: "mock-20260529-1",
    name: "Christian Marpaung",
    phone: "081311181107",
    birthday: "2026-05-29"
  },
  {
    id: "mock-20260529-2",
    name: "Ediono",
    phone: "0818143225",
    birthday: "2026-05-29"
  },
  {
    id: "mock-20260529-3",
    name: "Edward",
    phone: "081231113113",
    birthday: "2026-05-29"
  },
  {
    id: "mock-20260529-4",
    name: "Eldrans Yovenky",
    phone: "0818911829",
    birthday: "2026-05-29"
  },
  {
    id: "mock-20260529-5",
    name: "Elfrans Yovendi",
    phone: "0818911899",
    birthday: "2026-05-29"
  },
  {
    id: "mock-20260529-6",
    name: "Eli Sumartini",
    phone: "085362265454",
    birthday: "2026-05-29"
  },
  {
    id: "mock-20260530-1",
    name: "Maria Yosephine",
    phone: "081234560001",
    birthday: "2026-05-30"
  },
  {
    id: "mock-20260530-2",
    name: "Benny Setiawan",
    phone: "081234560002",
    birthday: "2026-05-30"
  },
  {
    id: "mock-20260531-1",
    name: "Grace Natalia",
    phone: "081234560003",
    birthday: "2026-05-31"
  }
];
