import React from 'react';
 
function Login() {
  return (
    <div className="container">
      <div className="logo-section">
        <div className="logo">
          METRÔ
        </div>
        <h1>Metrô SP - Canteiro de Obras</h1>
      </div>
      <div className="login-section">
        <h2>LOGIN</h2>
        <form className="form">
          <label htmlFor="username" className="label">Usuário</label>
          <input 
            type="text" 
            id="username" 
            placeholder="Digite o seu usuário" 
            className="input"
          />
          
          <label htmlFor="password" className="label">Senha</label>
          <input 
            type="password" 
            id="password" 
            placeholder="Digite sua senha" 
            className="input"
          />
          
          <button type="submit" className="button">Entrar</button>
        </form>
        <p className="register-text">
          Não possui cadastro? Clique <a href="#" className="link">AQUI</a> para se cadastrar
        </p>
      </div>
    </div>
  );
}

export default Login;