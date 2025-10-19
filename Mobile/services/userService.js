import { dynamoDB, USERS_TABLE } from '../config/aws-config';
import bcrypt from 'bcryptjs';

/**
 * Serviço para operações de usuário no DynamoDB - Mobile
 */
class UserService {
  /**
   * Autenticar usuário (login)
   * @param {string} username - Nome de usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise<Object>} Resultado da autenticação
   */
  async authenticateUser(username, password) {
    try {
      console.log('🔐 Tentando autenticar usuário:', username);
      
      // Buscar usuário no DynamoDB
      const user = await this.getUserByUsername(username);
      
      if (!user) {
        console.log('❌ Usuário não encontrado:', username);
        return {
          success: false,
          message: 'Usuário não encontrado'
        };
      }

      if (!user.isActive) {
        console.log('❌ Usuário inativo:', username);
        return {
          success: false,
          message: 'Usuário inativo'
        };
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        console.log('❌ Senha inválida para usuário:', username);
        return {
          success: false,
          message: 'Senha inválida'
        };
      }

      // Atualizar último login
      await this.updateLastLogin(username);

      // Retornar dados do usuário sem a senha
      const { password: _, ...userWithoutPassword } = user;
      
      console.log('✅ Usuário autenticado com sucesso:', username);
      return {
        success: true,
        user: userWithoutPassword,
        message: 'Login realizado com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro na autenticação:', error);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Buscar usuário por username
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
      console.log('✅ Último login atualizado para:', username);

    } catch (error) {
      console.error('Erro ao atualizar último login:', error);
    }
  }
}

export default new UserService();
