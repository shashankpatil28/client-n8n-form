import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to contracts page by default
    navigate("/dashboard/contracts", { replace: true });
  }, [navigate]);

  return null;
}
