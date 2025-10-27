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
}

const userServiceInstance = new UserService();
export default userServiceInstance;
