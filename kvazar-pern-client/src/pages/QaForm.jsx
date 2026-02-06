import { Link } from "react-router-dom";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import DopForm from "../components/DopForm";
import SiteForm from "../components/SiteForm";

import "./horizontalTabs.css";

const QaForm = () => {
  const [active, setActive] = useState("tab1");

  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (!user) return;

    const allowedRoles = ["user", "admin"];
    if (!allowedRoles.includes(user.role)) {
      navigate("/");
      return;
    }
  }, [token, user, navigate]);

  return (
    <div>
      <Link to="/dop-work">Таблица</Link>
        <div className="tabs-container">
          <div className="tab-list" role="tablist" aria-label="Simple horizontal tabs">
          <button
          role="tab"
          aria-selected={active === "tab1"}
          onClick={() => setActive("tab1")}
          className={`tab-button ${active === "tab1" ? "active" : ""}`}
          >
          Доп. Работы
          </button>


          <button
          role="tab"
          aria-selected={active === "tab2"}
          onClick={() => setActive("tab2")}
          className={`tab-button ${active === "tab2" ? "active" : ""}`}
          >
          Проверка сайтов
          </button>
          </div>

          <DopForm />
          <SiteForm />

          {/* <div className="tab-content">
          {active === "tab1" && (
          <div role="tabpanel"><DopForm /></div>
          )}
          {active === "tab2" && (
          <div role="tabpanel"><SiteForm /></div>
          )}
          </div> */}
        </div>
    </div>
  )
}

export default QaForm
