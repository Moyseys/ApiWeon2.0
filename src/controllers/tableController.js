import dotenv from 'dotenv';
import MongoDb from '../database/mongoDb';
import Permission from '../models/PermissionsModel';

import sequelize from '../database/index';

dotenv.config();

const queryInterface = sequelize.getQueryInterface();

class TableController {
  // table
  async store(req, res) {
    try {
      const existPermission = await Permission.checksPermission(req.userId, 'insert');

      if (!existPermission) {
        return res.status(400).json({
          errors: 'Este usuario não possui a permissao necessaria',
        });
      }

      const mongoDb = new MongoDb(req.company);
      const connection = await mongoDb.connect();

      const existDb = await mongoDb.existDb(req.company);

      if (!existDb) {
        return res.status(400).json({
          errors: 'O bancos de dados q ue vc esta tentando acessar não existe',
        });
      }

      const { name, fields } = req.body;

      if (!name || !fields) {
        return res.status(400).json({
          errors: 'Envie os valores corretos',
        });
      }

      const collections = (await connection.db().listCollections().toArray()).map((vl) => vl.name);

      if (collections.includes(name)) {
        return res.status(400).json({
          errors: 'Essa predefinição já existe',
        });
      }

      const arrayFieldsRequired = fields.map((vl) => vl.fieldName);

      const objFieldsProperties = fields.reduce((accumulator, vl) => {
        const config = { bsonType: vl.type, description: vl.description };
        accumulator[vl.fieldName] = config;
        return accumulator;
      }, {});

      await connection.db().createCollection(name, {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            title: `${name} validation`,
            required: arrayFieldsRequired,
            properties: objFieldsProperties,
          },
        },
      });

      return res.status(200).json({
        success: 'Predefinição criada com sucesso',
      });
    } catch (e) {
      return res.status(400).json({
        errors: 'Ocorreu um erro inesperado',
        e,
      });
    }
  }

  async index(req, res) {
    try {
      const mongoDb = new MongoDb(req.company);
      const connection = await mongoDb.connect();

      const existDb = await mongoDb.existDb(req.company);

      if (!existDb) {
        return res.status(400).json({
          errors: 'O bancos de dados q ue vc esta tentando acessar não existe',
        });
      }

      const response = [];
      const database = connection.db(mongoDb.database);

      const collections = (await database.listCollections().toArray()).map((cl) => cl.name);

      for (const collectionName of collections) {
        const collection = database.collection(collectionName);
        const document = await collection.findOne();

        const fields = document ? Object.keys(document) : {};

        const obj = { collectionName, fields };
        response.push(obj);
      }

      if (response.length <= 0) {
        return res.status(200).json({
          errors: 'Não há tabelas criadas',
        });
      }

      return res.status(200).json({ response });
    } catch (e) {
      return res.status(400).json({
        errors: 'Ocorreu um erro inesperado',
        e,
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

      if (!tableName) {
        return res.status(400).json({
          errors: 'Envie os valores corretos',
        });
      }
      const record = await queryInterface.tableExists(tableName);

      if (!record) {
        return res.status(400).json({
          errors: 'Essa tabela não existe',
        });
      }

      await queryInterface.dropTable(tableName, { force: true });
      // const sql = `DROP TABLE IF EXISTS ${process.env.DATABASE}.${tableName}`;
      // await sequelize.query(sql, { type: sequelize.QueryTypes.RAW });

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
      const { beforeName, afterName } = req.body;

      if (!beforeName || !afterName) {
        return res.status(400).json({
          errors: 'Envie os valores corretos',
        });
      }

      const existeTable = await queryInterface.tableExists(beforeName);

      if (!existeTable) {
        return res.status(400).json({
          errors: 'Essa tabela não existe',
        });
      }

      await queryInterface.renameTable(beforeName, afterName);

      return res.status(200).json({
        success: 'Tabela renomeada com sucesso',
      });
    } catch (e) {
      return res.status(400).json({
        errors: 'Ocorreu um erro inesperado',
      });
    }
  }
}

export default new TableController();
