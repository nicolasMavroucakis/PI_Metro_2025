import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Style/Register.css';
import MetroLogo from '../assets/metro.png';
import userService from '../services/userService';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpar mensagens quando usuário começar a digitar
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return false;
    }
    if (!formData.email.trim()) {
      setError('E-mail é obrigatório');
      return false;
    }
    if (!formData.username.trim()) {
      setError('Nome de usuário é obrigatório');
      return false;
    }
    if (!formData.password.trim()) {
      setError('Senha é obrigatória');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Senhas não coincidem');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return false;
    }
    
    // Validação básica de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('E-mail inválido');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!validateForm()) {
        setLoading(false);
        return;
      }

      // Criar usuário
      const result = await userService.createUser({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        username: formData.username.trim().toLowerCase(),
        password: formData.password
      });
      
      if (result.success) {
        setSuccess('Usuário cadastrado com sucesso! Redirecionando...');
        // Aguardar um pouco para mostrar a mensagem de sucesso
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      setError('Erro interno. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="logo-section">
        <div className="logo">
          <img src={MetroLogo} alt="Metro Logo" />
        </div>
        <h1>Metrô SP - Canteiro de Obras</h1>
      </div>
      <div className="register-section">
        <h2>CADASTRO</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <form className="form" onSubmit={handleSubmit}>
          <label htmlFor="name" className="label">Nome</label>
          <input 
            type="text" 
            id="name" 
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Digite seu nome completo" 
            className="input"
            disabled={loading}
          />
          
          <label htmlFor="username" className="label">Nome de Usuário</label>
          <input 
            type="text" 
            id="username" 
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Digite seu nome de usuário" 
            className="input"
            disabled={loading}
          />
          
          <label htmlFor="email" className="label">E-mail</label>
          <input 
            type="email" 
            id="email" 
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Digite seu e-mail" 
            className="input"
            disabled={loading}
          />
          
          <label htmlFor="password" className="label">Senha</label>
          <input 
            type="password" 
            id="password" 
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Digite sua senha (mín. 6 caracteres)" 
            className="input"
            disabled={loading}
          />
          
          <label htmlFor="confirmPassword" className="label">Confirmar Senha</label>
          <input 
            type="password" 
            id="confirmPassword" 
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirme sua senha" 
            className="input"
            disabled={loading}
          />
          
          <button type="submit" className="button" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
        <p className="login-text">
          Já possui cadastro? Clique <Link to="/" className="link">AQUI</Link> para fazer login
        </p>
      </div>
    </div>
  );
}

export default Register;
