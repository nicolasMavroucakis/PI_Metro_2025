import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import userService from '../services/userService';
import '../Style/Users.css';
import {
  Users as UsersIcon,
  UserPlus,
  User,
  ShieldCheck,
  Edit,
  Trash2,
  X
} from 'lucide-react';

function Users() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    name: '',
    role: 'user',
    isAdmin: false,
    isActive: true
  });

  const menuItems = [
    { icon: '🏠', label: 'Home', path: '/home' },
    { icon: '👥', label: 'Gerenciamento de Usuários', path: '/users' },
    { icon: '📊', label: 'Relatórios', path: '/reports' },
    { icon: '➕', label: 'Adicionar Projeto', path: '/add-project' }
  ];

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    
    // Verificar se é admin
    if (!user.isAdmin) {
      alert('Acesso negado. Apenas administradores podem acessar esta página.');
      navigate('/home');
      return;
    }
    
    loadUsers();
  }, [navigate]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const result = await userService.getAllUsers();
      
      if (result.success) {
        setUsers(result.users);
      } else {
        alert(`Erro ao carregar usuários: ${result.message}`);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      alert('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      email: '',
      name: '',
      role: 'user',
      isAdmin: false,
      isActive: true
    });
  };

  const handleCreateUser = () => {
    setModalMode('create');
    resetForm();
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '', // Não preencher senha
      email: user.email || '',
      name: user.name || '',
      role: user.role || 'user',
      isAdmin: user.isAdmin || false,
      isActive: user.isActive !== undefined ? user.isActive : true
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validações
    if (!formData.username.trim()) {
      alert('Nome de usuário é obrigatório');
      return;
    }

    if (modalMode === 'create' && !formData.password.trim()) {
      alert('Senha é obrigatória');
      return;
    }

    if (!formData.email.trim()) {
      alert('Email é obrigatório');
      return;
    }

    try {
      let result;
      
      if (modalMode === 'create') {
        result = await userService.createUserAdmin(formData);
      } else {
        // Para edição, só enviar senha se foi preenchida
        const updates = { ...formData };
        if (!updates.password.trim()) {
          delete updates.password;
        }
        delete updates.username; // Não pode alterar username
        
        result = await userService.updateUserAdmin(selectedUser.username, updates);
      }

      if (result.success) {
        alert(result.message);
        setShowModal(false);
        loadUsers();
      } else {
        alert(`Erro: ${result.message}`);
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      alert('Erro ao salvar usuário');
    }
  };

  const handleDeleteUser = async (user) => {
    // Não permitir deletar a si mesmo
    if (user.username === currentUser.username) {
      alert('Você não pode deletar sua própria conta!');
      return;
    }

    if (!window.confirm(`Deseja realmente excluir o usuário "${user.username}"?`)) {
      return;
    }

    try {
      const result = await userService.deleteUserAdmin(user.username);
      
      if (result.success) {
        alert(result.message);
        loadUsers();
      } else {
        alert(`Erro: ${result.message}`);
      }
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      alert('Erro ao deletar usuário');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Layout menuItems={menuItems}>
        <div className="users-loading">
          <p>Carregando usuários...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout menuItems={menuItems}>
      <div className="users-container">
        <header className="users-header">
          <h1><UsersIcon size={28} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Gerenciamento de Usuários</h1>
          <p className="subtitle">Total: {users.length} usuários</p>
          <button className="btn-create-user" onClick={handleCreateUser}>
            <UserPlus size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Novo Usuário
          </button>
        </header>

        <main className="users-main">
          {users.length === 0 ? (
            <div className="users-empty">
              <div className="empty-icon"><User size={48} /></div>
              <h3>Nenhum usuário encontrado</h3>
              <p>Clique em "Novo Usuário" para criar o primeiro usuário.</p>
            </div>
          ) : (
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Função</th>
                    <th>Status</th>
                    <th>Último Login</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.username}>
                      <td className="username-cell">
                        <strong>{user.username}</strong>
                        {user.isAdmin && <span className="admin-badge"><ShieldCheck size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> ADMIN</span>}
                      </td>
                      <td className="name-cell">{user.name || '-'}</td>
                      <td className="email-cell">{user.email}</td>
                      <td>
                        <span className="role-badge">{user.role || 'user'}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                          {user.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="last-login-cell">{formatDate(user.lastLogin)}</td>
                      <td className="actions-cell">
                        <button 
                          className="btn-edit"
                          onClick={() => handleEditUser(user)}
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteUser(user)}
                          disabled={user.username === currentUser.username}
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>

        {/* Modal de Criar/Editar */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{modalMode === 'create' ? (<><UserPlus size={20} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Novo Usuário</>) : (<><Edit size={20} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Editar Usuário</>)}</h2>
                <button className="btn-close" onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>
              
              <form onSubmit={handleSubmit} className="user-form">
                {/* Username */}
                <div className="form-group">
                  <label htmlFor="username">Username *</label>
                  <input
                    type="text"
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Digite o username"
                    readOnly={modalMode === 'edit'}
                    required
                  />
                </div>

                {/* Password */}
                <div className="form-group">
                  <label htmlFor="password">
                    Senha {modalMode === 'create' ? '*' : '(deixe vazio para não alterar)'}
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Digite a senha"
                    required={modalMode === 'create'}
                  />
                </div>

                {/* Email */}
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Digite o email"
                    required
                  />
                </div>

                {/* Name */}
                <div className="form-group">
                  <label htmlFor="name">Nome Completo</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Digite o nome completo"
                  />
                </div>

                {/* Role */}
                <div className="form-group">
                  <label htmlFor="role">Função</label>
                  <input
                    type="text"
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Ex: user, manager, admin"
                  />
                </div>

                {/* Is Admin */}
                <div className="form-group-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isAdmin}
                      onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                    />
                    <span>É Administrador?</span>
                  </label>
                </div>

                {/* Is Active */}
                <div className="form-group-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <span>Usuário Ativo?</span>
                  </label>
                </div>

                {/* Buttons */}
                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-submit">
                    {modalMode === 'create' ? 'Criar' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Users;


