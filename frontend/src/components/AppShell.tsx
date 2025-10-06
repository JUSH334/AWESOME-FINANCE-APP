import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";
export default function AppShell() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto max-w-[1400px] grid grid-cols-12 gap-4 p-4">
        <div className="col-span-12 md:col-span-3 xl:col-span-2"><Sidebar /></div>
        <main className="col-span-12 md:col-span-9 xl:col-span-10">
          <Header />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
