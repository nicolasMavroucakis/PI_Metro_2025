import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Style/Login.css';
import MetroLogo from '../assets/metro.png';
import userService from '../services/userService';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpar erro quando usuário começar a digitar
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validações básicas
      if (!formData.username.trim() || !formData.password.trim()) {
        setError('Por favor, preencha todos os campos');
        setLoading(false);
        return;
      }

      // Autenticar usuário
      const result = await userService.authenticateUser(formData.username, formData.password);
      
      if (result.success) {
        // Salvar dados do usuário no localStorage (ou context)
        localStorage.setItem('user', JSON.stringify(result.user));
        navigate('/home');
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Erro no login:', error);
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
      <div className="login-section">
        <h2>LOGIN</h2>
        {error && <div className="error-message">{error}</div>}
        <form className="form" onSubmit={handleSubmit}>
          <label htmlFor="username" className="label">Usuário</label>
          <input 
            type="text" 
            id="username" 
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Digite o seu usuário" 
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
            placeholder="Digite sua senha" 
            className="input"
            disabled={loading}
          />
          
          <button type="submit" className="button" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="register-text">
          Não possui cadastro? Clique <Link to="/register" className="link">AQUI</Link> para se cadastrar
        </p>
      </div>
    </div>
  );
}

export default Login;