import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/Mainlayout";
import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import MasterBarang from "./Pages/Master/MasterBarang";
import MasterPendoa from "./Pages/Master/Pendoa";
import MasterDonaturPage from "./Pages/Master/Donatur";
import TRBirthdayPrayPage from "./Pages/Transaction/TRBirthdayPray";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route element={<MainLayout/>}>
                    <Route path="/dashboard" element={<Dashboard/>} />
                    <Route path="/master-barang" element={<MasterBarang/>} />
                    <Route path="/master-pendoa" element={<MasterPendoa/>} />
                    <Route path="/master-donatur" element={<MasterDonaturPage/>} />
                    <Route path="/transaksi-birthday-pray/:idDonatur" element={<TRBirthdayPrayPage/>} />

                </Route>
            </Routes>
        </BrowserRouter>
    );
}
