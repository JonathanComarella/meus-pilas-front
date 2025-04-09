import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./Login.css";

const LoginPage: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstname: "",
    lastname: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (isLoginMode) {
        const response = await api.post("/auth/login", {
          email: formData.email,
          password: formData.password,
        });

        const token = response.data.token || response.data;
        if (!token) throw new Error("Token não recebido do servidor.");

        localStorage.setItem("token", token);
        navigate("/dashboard");
      } else {
        await api.post(
          "/user/register",
          {
            email: formData.email,
            password: formData.password,
            firstname: formData.firstname,
            lastname: formData.lastname,
            role: "ADMIN", // escondido
          },
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        alert("Cadastro realizado com sucesso! Faça login.");
        setIsLoginMode(true);
        setFormData({ email: "", password: "", firstname: "", lastname: "" });
      }
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data?.message || "Erro ao processar requisição.");
      } else if (err.request) {
        setError("Servidor indisponível. Tente mais tarde.");
      } else {
        setError("Erro inesperado. Verifique o console.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>{isLoginMode ? "Login" : "Cadastro"}</h2>

        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit} className="login-form">
          {!isLoginMode && (
            <>
              <input
                type="text"
                name="firstname"
                placeholder="Nome"
                value={formData.firstname}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="lastname"
                placeholder="Sobrenome"
                value={formData.lastname}
                onChange={handleChange}
                required
              />
            </>
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Senha"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Carregando..." : isLoginMode ? "Entrar" : "Cadastrar"}
          </button>
        </form>

        <p className="toggle-text">
          {isLoginMode ? "Não tem conta?" : "Já tem conta?"}{" "}
          <span onClick={() => setIsLoginMode(!isLoginMode)}>
            {isLoginMode ? "Cadastre-se" : "Faça login"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
