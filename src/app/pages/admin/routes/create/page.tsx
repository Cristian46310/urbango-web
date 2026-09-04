import { Navigate } from "react-router-dom";

/** Legacy entry: unified routes live under business. */
export default function AdminRouteCreatePage() {
  return <Navigate to="/app/business/routes?mode=create" replace />;
}
