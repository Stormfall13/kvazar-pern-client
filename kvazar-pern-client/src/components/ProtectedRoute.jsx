// import { Navigate } from "react-router-dom";
// import { useSelector } from "react-redux";

// const ProtectedRoute = ({ children, allowedRoles = [] }) => {
//     const { user, token, isLoading } = useSelector((state) => state.auth);

//     // console.log("ProtectedRoute: user =", user, "token =", token, "allowedRoles =", allowedRoles);

//     // Если нет токена или пользователя – отправляем на логин
//     if (!token || !user) {
//         // console.log("ProtectedRoute: ❌ Нет токена или пользователя, редирект на /login");
//         return <Navigate to="/login" replace />;
//     }

//     // Если у пользователя нет нужной роли – отправляем на главную
//     if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
//         // console.log(`ProtectedRoute: ❌ Роль ${user.role} не входит в ${allowedRoles}, редирект на /`);
//         return <Navigate to="/" replace />;
//     }
//     // console.log("ProtectedRoute: Доступ разрешён, рендерим children");
//     return children;
// };

// export default ProtectedRoute;


import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, token, isLoading } = useSelector((state) => state.auth);
    const [checking, setChecking] = useState(true);

    console.log("ProtectedRoute: user =", user, "token =", token, "isLoading =", isLoading, "allowedRoles =", allowedRoles);

    useEffect(() => {
        // Даем время на инициализацию auth состояния
        const timer = setTimeout(() => {
            setChecking(false);
            console.log("ProtectedRoute: проверка завершена");
        }, 500);
        
        return () => clearTimeout(timer);
    }, []);

    // Пока проверяем/загружаем - показываем заглушку
    if (checking || isLoading) {
        console.log("ProtectedRoute: ⏳ Загрузка/проверка...");
        return <div style={{ padding: '20px', textAlign: 'center' }}>Проверка доступа...</div>;
    }

    // Если нет токена или пользователя – отправляем на логин
    if (!token || !user) {
        console.log("ProtectedRoute: ❌ Нет токена или пользователя, редирект на /login");
        return <Navigate to="/login" replace />;
    }

    // Если у пользователя нет нужной роли – отправляем на главную
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        console.log(`ProtectedRoute: ❌ Роль ${user.role} не входит в ${allowedRoles}, редирект на /`);
        return <Navigate to="/" replace />;
    }

    console.log("ProtectedRoute: ✅ Доступ разрешён, рендерим children");
    return children;
};

export default ProtectedRoute;
