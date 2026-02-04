"use client";

import { useState } from "react";
import Login from "@/components/Login";
import Register from "@/components/Register";

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <>
      {isLogin ? (
        <Login onNavigateToRegister={() => setIsLogin(false)} />
      ) : (
        <Register onNavigateToLogin={() => setIsLogin(true)} />
      )}
    </>
  );
}
