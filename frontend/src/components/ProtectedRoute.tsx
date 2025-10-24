
﻿import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../stores/auth";
export default function ProtectedRoute() {
  const isAuth = useAuth(s => s.isAuth);
  
  return isAuth ? <Outlet /> : <Navigate to="/login" replace />;
}
