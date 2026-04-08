import type { ReactElement } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";
import MainLayout from "./layouts/Mainlayout";
import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import MasterBarang from "./Pages/Master/MasterBarang";
import MasterPendoa from "./Pages/Master/Pendoa";
import MasterDonaturPage from "./Pages/Master/Donatur";
import TRBirthdayPrayPage from "./Pages/Transaction/TRBirthdayPray";
import MasterUserPage from "./Pages/Tools/MasterUser";
import ChangePasswordPage from "./Pages/Tools/ChangePassword";
import AboutPage from "./Pages/Tools/About";
import { canManageMasterUser, mustChangePassword } from "./utils/authAccess";

function RequireMasterUserAccess({ children }: { children: ReactElement }) {
    if (!canManageMasterUser()) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

function RequirePasswordChange({ children }: { children: ReactElement }) {
    if (mustChangePassword()) {
        return <Navigate to="/tools-change-password" replace />;
    }

    return children;
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route element={<MainLayout/>}>
                    <Route path="/dashboard" element={
                        <RequirePasswordChange>
                            <Dashboard/>
                        </RequirePasswordChange>
                    } />
                    <Route path="/master-barang" element={
                        <RequirePasswordChange>
                            <MasterBarang/>
                        </RequirePasswordChange>
                    } />
                    <Route path="/master-pendoa" element={
                        <RequirePasswordChange>
                            <MasterPendoa/>
                        </RequirePasswordChange>
                    } />
                    <Route path="/master-donatur" element={
                        <RequirePasswordChange>
                            <MasterDonaturPage/>
                        </RequirePasswordChange>
                    } />
                    <Route path="/transaksi-birthday-pray/:idDonatur" element={
                        <RequirePasswordChange>
                            <TRBirthdayPrayPage/>
                        </RequirePasswordChange>
                    } />
                    <Route path="/tools-master-user" element={
                        <RequirePasswordChange>
                            <RequireMasterUserAccess>
                                <MasterUserPage/>
                            </RequireMasterUserAccess>
                        </RequirePasswordChange>
                    } />
                    <Route path="/tools-about" element={
                        <RequirePasswordChange>
                            <AboutPage/>
                        </RequirePasswordChange>
                    } />
                    <Route path="/tools-change-password" element={<ChangePasswordPage/>} />

                </Route>
            </Routes>
        </BrowserRouter>
    );
}
