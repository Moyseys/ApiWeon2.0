import Permission from '../models/PermissionsModel';

import sequelize from '../database/index';

import MongoDb from '../database/mongoDb';

const queryInterface = sequelize.getQueryInterface();

class ValueController {
  async store(req, res) {
    const existPermission = await Permission.checksPermission(req.userId, 'insert');

    if (!existPermission) {
      return res.status(400).json({
        errors: 'Este usuario não possui a permissao necessaria',
      });
    }
    const { collectionName, values } = req.body;

    if (!collectionName || !values) {
      return res.status(400).json({
        errors: 'Valores inválidos',
      });
    }

    const mongoDb = new MongoDb(req.company);
    const client = await mongoDb.connect();
    try {
      const dbExist = await mongoDb.existDb(req.company);

      if (!dbExist) {
        return res.status(400).json({
          errors: `A tabela ${collectionName} não exite`,
        });
      }
      const database = client.db(req.company);
      const collection = database.collection(collectionName);

      await collection.insertMany(values);

      return res.status(200).json({
        success: 'Cadastro bem sucedido',
      });
    } catch (e) {
      return res.status(400).json({
        errors: 'Ocorreu um erro inesperado',
      });
    } finally {
      mongoDb.close();
    }
  }

  async index(req, res) {
    const { collectionName } = req.params;

    if (!collectionName) {
      return res.status(400).json({
        errors: 'Envie os valores corretos',
      });
    }

    const mongoDb = new MongoDb(req.company);
    const client = await mongoDb.connect();

    try {
      const dbExist = await mongoDb.existDb(req.company);

      if (!dbExist) {
        return res.status(400).json({
          errors: `A base de dados ${collectionName} não exite`,
        });
      }
      const database = client.db(req.company);
      const collection = database.collection(collectionName);

      const values = await collection.find({}).toArray();

      return res.status(200).json(values);
    } catch (e) {
      return res.status(400).json({
        errors: 'Ocorreu um erro inesperado',
      });
    } finally {
      mongoDb.close();
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

      const { collectionName } = req.body;
      const { id } = req.params;

      if (!collectionName || !id) {
        return res.status(400).json({
          errors: 'Valores inválidos',
        });
      }

      const tableExist = await queryInterface.tableExists(collectionName);

      if (!tableExist) {
        return res.status(400).json({
          errors: `A tabela ${collectionName} não exite`,
        });
      }

      const valueExiste = await queryInterface.select(null, collectionName, { where: { id } })
        .then((values) => (!!values.length));

      if (!valueExiste) {
        return res.status(400).json({
          errors: `Não existe um valor com o id: ${id}`,
        });
      }

      await queryInterface.bulkDelete(collectionName, { id });

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
      const { collectionName, fieldName, value } = req.body;

      if (!collectionName || !fieldName || !value || !id) {
        return res.status(400).json({
          errors: 'Valores inválidos',
        });
      }

      const tableExist = await queryInterface.tableExists(collectionName);

      if (!tableExist) {
        return res.status(400).json({
          errors: `A tabela ${collectionName} não exite`,
        });
      }

      const tabela = await queryInterface.describeTable(collectionName);
      if (!tabela[fieldName]) {
        return res.status(400).json({
          errors: `O campo '${fieldName}' não existe na tabela.`,
        });
      }

      const registro = await queryInterface.select(null, collectionName, {
        where: { id },
      });

      if (registro.length === 0) {
        return res.status(400).json({
          errors: `O registro com o ID '${id}' não existe na tabela '${collectionName}`,
        });
      }

      await queryInterface.bulkUpdate(collectionName, { [fieldName]: value }, { id });

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

export default new ValueController();
