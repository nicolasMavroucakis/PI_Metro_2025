import { dynamoDB, USERS_TABLE } from '../config/aws-config';
import bcrypt from 'bcryptjs';

/**
 * Serviço para operações de usuário no DynamoDB
 */
class UserService {
  /**
   * Criar um novo usuário
   * @param {Object} userData 
   * @param {string} userData.username 
   * @param {string} userData.email 
   * @param {string} userData.password 
   * @param {string} userData.name
   * @returns {Promise<Object>} 
   */
  async createUser(userData) {
    try {
      const { username, email, password, name } = userData;
      
      // Verificar se o usuário já existe
      const existingUser = await this.getUserByUsername(username);
      if (existingUser) {
        throw new Error('Usuário já existe');
      }

      // Verificar se o email já está em uso
      const existingEmail = await this.getUserByEmail(email);
      if (existingEmail) {
        throw new Error('E-mail já está em uso');
      }

      // Hash da senha
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Dados do usuário para inserir no DynamoDB
      const userItem = {
        username: username,
        email: email,
        password: hashedPassword,
        name: name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      };

      // Inserir usuário no DynamoDB
      const params = {
        TableName: USERS_TABLE,
        Item: userItem,
        ConditionExpression: 'attribute_not_exists(username)'
      };

      await dynamoDB.put(params).promise();
      
      // Retornar dados do usuário sem a senha
      const { password: _, ...userWithoutPassword } = userItem;
      return {
        success: true,
        user: userWithoutPassword,
        message: 'Usuário criado com sucesso'
      };

    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return {
        success: false,
        message: error.message || 'Erro interno do servidor'
      };
    }
  }

  /**
   * Autenticar usuário (login)
   * @param {string} username - Nome de usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise<Object>} Resultado da autenticação
   */
  async authenticateUser(username, password) {
    try {
      // Buscar usuário no DynamoDB
      const user = await this.getUserByUsername(username);
      
      if (!user) {
        return {
          success: false,
          message: 'Usuário não encontrado'
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          message: 'Usuário inativo'
        };
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Senha incorreta'
        };
      }

      // Atualizar último login
      await this.updateLastLogin(username);

      // Retornar dados do usuário sem a senha
      const { password: _, ...userWithoutPassword } = user;
      return {
        success: true,
        user: userWithoutPassword,
        message: 'Login realizado com sucesso'
      };

    } catch (error) {
      console.error('Erro na autenticação:', error);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Buscar usuário por nome de usuário
   * @param {string} username - Nome de usuário
   * @returns {Promise<Object|null>} Dados do usuário ou null
   */
  async getUserByUsername(username) {
    try {
      const params = {
        TableName: USERS_TABLE,
        Key: {
          username: username
        }
      };

      const result = await dynamoDB.get(params).promise();
      return result.Item || null;

    } catch (error) {
      console.error('Erro ao buscar usuário por username:', error);
      return null;
    }
  }

  /**
   * Buscar usuário por e-mail
   * @param {string} email - E-mail do usuário
   * @returns {Promise<Object|null>} Dados do usuário ou null
   */
  async getUserByEmail(email) {
    try {
      const params = {
        TableName: USERS_TABLE,
        IndexName: 'EmailIndex', // Assumindo que existe um GSI para email
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email
        }
      };

      const result = await dynamoDB.query(params).promise();
      return result.Items && result.Items.length > 0 ? result.Items[0] : null;

    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      // Se o índice não existir, fazer um scan (menos eficiente)
      return await this.scanUserByEmail(email);
    }
  }

  /**
   * Buscar usuário por e-mail usando scan (fallback)
   * @param {string} email - E-mail do usuário
   * @returns {Promise<Object|null>} Dados do usuário ou null
   */
  async scanUserByEmail(email) {
    try {
      const params = {
        TableName: USERS_TABLE,
        FilterExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email
        }
      };

      const result = await dynamoDB.scan(params).promise();
      return result.Items && result.Items.length > 0 ? result.Items[0] : null;

    } catch (error) {
      console.error('Erro ao fazer scan por email:', error);
      return null;
    }
  }

  /**
   * Atualizar último login do usuário
   * @param {string} username - Nome de usuário
   * @returns {Promise<void>}
   */
  async updateLastLogin(username) {
    try {
      const params = {
        TableName: USERS_TABLE,
        Key: {
          username: username
        },
        UpdateExpression: 'SET lastLogin = :lastLogin, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':lastLogin': new Date().toISOString(),
          ':updatedAt': new Date().toISOString()
        }
      };

      await dynamoDB.update(params).promise();
    } catch (error) {
      console.error('Erro ao atualizar último login:', error);
    }
  }

  // ==================== ADMIN FUNCTIONS ====================

  /**
   * Listar todos os usuários (apenas admin)
   * @returns {Promise<Object>} Lista de usuários
   */
  async getAllUsers() {
    try {
      console.log('📋 Buscando todos os usuários...');
      
      const params = {
        TableName: USERS_TABLE
      };

      const result = await dynamoDB.scan(params).promise();
      
      // Remover senhas dos usuários
      const users = result.Items.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      console.log(`✅ ${users.length} usuários encontrados`);
      return {
        success: true,
        users: users,
        count: users.length
      };

    } catch (error) {
      console.error('❌ Erro ao listar usuários:', error);
      return {
        success: false,
        message: 'Erro ao listar usuários',
        users: []
      };
    }
  }

  /**
   * Criar novo usuário (apenas admin)
   * @param {Object} userData - Dados do usuário
   * @returns {Promise<Object>} Resultado da operação
   */
  async createUserAdmin(userData) {
    try {
      console.log('👤 Criando novo usuário:', userData.username);

      // Verificar se usuário já existe
      const existingUser = await this.getUserByUsername(userData.username);
      if (existingUser) {
        return {
          success: false,
          message: 'Usuário já existe'
        };
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const newUser = {
        username: userData.username,
        password: hashedPassword,
        email: userData.email,
        name: userData.name || userData.fullName || '',
        role: userData.role || 'user',
        isAdmin: userData.isAdmin || false,
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: null
      };

      const params = {
        TableName: USERS_TABLE,
        Item: newUser
      };

      await dynamoDB.put(params).promise();

      console.log('✅ Usuário criado com sucesso:', userData.username);
      
      const { password, ...userWithoutPassword } = newUser;
      return {
        success: true,
        message: 'Usuário criado com sucesso',
        user: userWithoutPassword
      };

    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      return {
        success: false,
        message: 'Erro ao criar usuário'
      };
    }
  }

  /**
   * Atualizar usuário (apenas admin)
   * @param {string} username - Nome de usuário
   * @param {Object} updates - Dados a atualizar
   * @returns {Promise<Object>} Resultado da operação
   */
  async updateUserAdmin(username, updates) {
    try {
      console.log('✏️ Atualizando usuário:', username);

      // Verificar se usuário existe
      const existingUser = await this.getUserByUsername(username);
      if (!existingUser) {
        return {
          success: false,
          message: 'Usuário não encontrado'
        };
      }

      // Construir expressão de atualização
      let updateExpression = 'SET updatedAt = :updatedAt';
      const expressionAttributeValues = {
        ':updatedAt': new Date().toISOString()
      };
      const expressionAttributeNames = {};

      // Adicionar campos a atualizar
      if (updates.email !== undefined) {
        updateExpression += ', email = :email';
        expressionAttributeValues[':email'] = updates.email;
      }

      if (updates.name !== undefined) {
        updateExpression += ', #name = :name';
        expressionAttributeValues[':name'] = updates.name;
        expressionAttributeNames['#name'] = 'name';
      }

      if (updates.role !== undefined) {
        updateExpression += ', #role = :role';
        expressionAttributeValues[':role'] = updates.role;
        expressionAttributeNames['#role'] = 'role';
      }

      if (updates.isAdmin !== undefined) {
        updateExpression += ', isAdmin = :isAdmin';
        expressionAttributeValues[':isAdmin'] = updates.isAdmin;
      }

      if (updates.isActive !== undefined) {
        updateExpression += ', isActive = :isActive';
        expressionAttributeValues[':isActive'] = updates.isActive;
      }

      // Se atualizar senha, fazer hash
      if (updates.password) {
        const hashedPassword = await bcrypt.hash(updates.password, 10);
        updateExpression += ', password = :password';
        expressionAttributeValues[':password'] = hashedPassword;
      }

      const params = {
        TableName: USERS_TABLE,
        Key: {
          username: username
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      };

      if (Object.keys(expressionAttributeNames).length > 0) {
        params.ExpressionAttributeNames = expressionAttributeNames;
      }

      const result = await dynamoDB.update(params).promise();

      console.log('✅ Usuário atualizado com sucesso:', username);

      const { password, ...userWithoutPassword } = result.Attributes;
      return {
        success: true,
        message: 'Usuário atualizado com sucesso',
        user: userWithoutPassword
      };

    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error);
      return {
        success: false,
        message: 'Erro ao atualizar usuário'
      };
    }
  }

  /**
   * Deletar usuário (apenas admin)
   * @param {string} username - Nome de usuário a deletar
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteUserAdmin(username) {
    try {
      console.log('🗑️ Deletando usuário:', username);

      // Verificar se usuário existe
      const existingUser = await this.getUserByUsername(username);
      if (!existingUser) {
        return {
          success: false,
          message: 'Usuário não encontrado'
        };
      }

      const params = {
        TableName: USERS_TABLE,
        Key: {
          username: username
        }
      };

      await dynamoDB.delete(params).promise();

      console.log('✅ Usuário deletado com sucesso:', username);
      return {
        success: true,
        message: 'Usuário deletado com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro ao deletar usuário:', error);
      return {
        success: false,
        message: 'Erro ao deletar usuário'
      };
    }
  }
}

const userServiceInstance = new UserService();
export default userServiceInstance;
