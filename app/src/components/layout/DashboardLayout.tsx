import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen w-full bg-slate-50 flex">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
