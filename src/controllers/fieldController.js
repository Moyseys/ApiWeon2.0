import Permission from '../models/PermissionsModel';

import sequelize from '../database/index';

import MongoDb from '../database/mongoDb';

const queryInterface = sequelize.getQueryInterface();

class TableController {
  async show(req, res) {
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

      const fields = await queryInterface.describeTable(tableName);

      return res.status(200).json(fields);
    } catch (e) {
      return res.status(400).json({
        errors: 'Ocorreu um erro inesperado',
      });
    }
  }

  async store(req, res) {
    try {
      const existPermission = await Permission.checksPermission(req.userId, 'insert');

      if (!existPermission) {
        return res.status(400).json({
          errors: 'Este usuario não possui a permissao necessaria',
        });
      }

      const { collectionName, fieldName, options } = req.body;

      if (!collectionName || !fieldName || !options) {
        return res.status(400).json({
          errors: 'Valores inválidos',
        });
      }

      // validar campo

      // veredicar se a collection existe

      // verificar se o campo já existe

      // add campo
      const mongoDb = new MongoDb(req.company);
      const client = await mongoDb.connect();
      const db = client.db(mongoDb.database);

      const document = {};
      document[fieldName] = '';

      await db.collection(collectionName).insertOne(document);
      return res.json(true);
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

      const { tableName, fieldName } = req.body;

      if (!fieldName || !tableName) {
        return res.status(400).json({
          errors: 'Valor inválido',
        });
      }

      const tableExist = await queryInterface.tableExists(tableName);

      if (!tableExist) {
        return res.status(400).json({
          errors: `A tabela ${tableName} não exite`,
        });
      }

      queryInterface.removeColumn(tableName, fieldName);

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

      const { tableName, fieldNameBefore, fieldNameAfter } = req.body;

      if (!tableName || !fieldNameBefore || !fieldNameAfter) {
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

      const tableDescribe = await queryInterface.describeTable(tableName);

      if (!tableDescribe[fieldNameBefore]) {
        return res.status(400).json({
          errors: 'Este campo não existe',
        });
      }

      await queryInterface.renameColumn(tableName, fieldNameBefore, fieldNameAfter);

      return res.json({
        success: 'Campo renomeado com sucesso',
      });
    } catch (e) {
      return res.status(400).json({
        errors: 'Ocorreu um erro inesperado',
      });
    }
  }
}

export default new TableController();
