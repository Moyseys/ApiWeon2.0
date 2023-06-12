import { DataTypes } from 'sequelize';
import Permission from '../models/PermissionsModel';

import sequelize from '../database/index';

const queryInterface = sequelize.getQueryInterface();

class valueController {
  async store(req, res) {
    try {
      const existPermission = await Permission.checksPermission(req.userId, 'insert');

      if (!existPermission) {
        return res.status(400).json({
          errors: 'Este usuario não possui a permissao necessaria',
        });
      }
      const { tableName, values } = req.body;

      if (!tableName || !values) {
        return res.status(400).json({
          errors: 'Valores inválidos',
        });
      }

      const tableExist = await queryInterface.tableExists(tableName);

      if (!tableExist) {
        return res.status(400).json({
          errors: `A tabela ${tableName} não exite`,
        });
      }
      //validações
      const describeTable = await queryInterface.describeTable(tableName);

      for (const key in values) {
        if (!describeTable[key]) {
          return res.status(400).json({
            errors: `O campo ${key} não exite na tabela ${tableName}`,
          });
        }
      }

      await queryInterface.bulkInsert(tableName, [values]);

      return res.json(true);
    } catch (e) {
      return res.status(400).json({
        errors: 'Ocorreu um erro inesperado',
      });
    }
  }

  async index(req, res) {
    try {
      const { tableName } = req.params;

      if (!tableName) {
        return res.status(400).json({
          errors: 'Envie os valores corretos',
        });
      }

      const tableExist = await queryInterface.tableExists(tableName);

      if (!tableExist) {
        return res.status(400).json({
          errors: `A tabela ${tableName} não exite`,
        });
      }

      const values = await queryInterface.select(null, tableName);

      return res.status(200).json(values);
    } catch (e) {
      return res.status(400).json({
        errors: 'Ocorreu um erro inesperado',
      });
    }
  }

  async delete(req, res) {
    try {
      const existPermission = await Permission.checksPermission(req.userId, 'delet');

      if (!existPermission) {
        return res.status(400).json({
          errors: 'Este usuario não possui a permissao necessaria',
        });
      }

      const { tableName } = req.body;
      const { id } = req.params;

      if (!tableName || !id) {
        return res.status(400).json({
          errors: 'Valores inválidos',
        });
      }

      const tableExist = await queryInterface.tableExists(tableName);

      if (!tableExist) {
        return res.status(400).json({
          errors: `A tabela ${tableName} não exite`,
        });
      }

      const valueExiste = await queryInterface.select(null, tableName, { where: { id } })
        .then((values) => (!!values.length));

      if (!valueExiste) {
        return res.status(400).json({
          errors: `Não existe um valor com o id: ${id}`,
        });
      }

      await queryInterface.bulkDelete(tableName, { id });

      return res.status(200).json(true);
    } catch (e) {
      return res.status(400).json({
        errors: 'Ocorreu um erro inesperado',
      });
    }
  }

  async update(req, res) {
    try {
      const existPermission = await Permission.checksPermission(req.userId, 'edit');

      if (!existPermission) {
        return res.status(400).json({
          errors: 'Este usuario não possui a permissao necessaria',
        });
      }

      const { id } = req.params;
      const { tableName, fieldName, value } = req.body;

      if (!tableName || !fieldName || !value || !id) {
        return res.status(400).json({
          errors: 'Valores inválidos',
        });
      }

      const tableExist = await queryInterface.tableExists(tableName);

      if (!tableExist) {
        return res.status(400).json({
          errors: `A tabela ${tableName} não exite`,
        });
      }

      const tabela = await queryInterface.describeTable(tableName);
      if (!tabela[fieldName]) {
        return res.status(400).json({
          errors: `O campo '${fieldName}' não existe na tabela.`,
        });
      }

      const registro = await queryInterface.select(null, tableName, {
        where: { id },
      });

      if (registro.length === 0) {
        return res.status(400).json({
          errors: `O registro com o ID '${id}' não existe na tabela '${tableName}`,
        });
      }

      await queryInterface.bulkUpdate(tableName, { [fieldName]: value }, { id });

      return res.json({
        success: `campo ${fieldName} alterado com sucesso`,
      });
    } catch (e) {
      return res.status(400).json({
        errors: 'Ocorreu um erro inesperado',
      });
    }
  }
}

export default new valueController();