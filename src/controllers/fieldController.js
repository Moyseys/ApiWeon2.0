import Permission from '../models/PermissionsModel';

import sequelize from '../database/index';

import MongoDb from '../database/mongoDb';

const queryInterface = sequelize.getQueryInterface();

class TableController {
  async show(req, res) {
    const { collectionName } = req.params;

    if (!collectionName) {
      return res.status(400).json({
        errors: 'Envie os valores corretos',
      });
    }

    const mongoDb = new MongoDb(req.company);
    const client = await mongoDb.connect();

    try {
      // table exist
      const database = client.db(req.company);
      const collections = (await database.listCollections().toArray()).map((collec) => collec.name);
      const collectionExist = collections.includes(collectionName);

      if (!collectionExist) {
        return res.status(400).json({
          errors: `A collection ${collectionName} não exite`,
        });
      }
      const collection = database.collection(collectionName);
      const validationCollection = await collection.options();
      return res.status(200).json(validationCollection);
    } catch (e) {
      return res.status(400).json({
        errors: 'Ocorreu um erro inesperado',
        e,
      });
    } finally {
      mongoDb.close();
    }
  }

  async store(req, res) {
    const existPermission = await Permission.checksPermission(req.userId, 'insert');

    if (!existPermission) {
      return res.status(400).json({
        errors: 'Este usuario não possui a permissao necessaria',
      });
    }

    const { collectionName, fieldName, options } = req.body;

    if (!collectionName || !options || !fieldName) {
      return res.status(400).json({
        errors: 'Valores inválidos',
      });
    }

    const mongoDb = new MongoDb(req.company);
    const client = await mongoDb.connect();

    try {
      const database = client.db(req.company);

      let rule;
      const rules = await database.collection(collectionName).options();

      if (!rules.validator) {
        let properties = {
          [fieldName]: {
            bsonType: options.type,
            description: options.description,
          },
        };
        let required = options.required ? [fieldName] : [];

        rule = {
          validator: {
            $jsonSchema: {
              bsonType: 'object',
              title: `${collectionName} rule`,
              required,
              properties,
            },
          },
          validationLevel: 'strict',
          validationAction: 'error',
        };
      } else {
        let { properties } = rules.validator.$jsonSchema;
        let { required } = rules.validator.$jsonSchema;

        if (properties[fieldName]) {
          return res.status(400).json({
            errors: 'Este campo já existe',
          });
        }

        if (options.required) {
          required.push(fieldName);
        }

        properties[fieldName] = {
          bsonType: options.type,
          description: options.description,
        };

        rule = {
          validator: {
            $jsonSchema: {
              bsonType: 'object',
              title: `${collectionName} rule`,
              required,
              properties,
            },
          },
          validationLevel: 'strict',
          validationAction: 'error',
        };
      }

      const command = {
        collMod: collectionName,
        validator: rule.validator,
      };

      await database.command(command);

      return res.status(200).json({
        command,
        success: 'Campo criado com sucesso',
      });
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

      const { collectionName, fieldName } = req.body;

      if (!fieldName || !collectionName) {
        return res.status(400).json({
          errors: 'Valor inválido',
        });
      }

      const tableExist = await queryInterface.tableExists(collectionName);

      if (!tableExist) {
        return res.status(400).json({
          errors: `A tabela ${collectionName} não exite`,
        });
      }

      queryInterface.removeColumn(collectionName, fieldName);

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

      const { collectionName, fieldNameBefore, fieldNameAfter } = req.body;

      if (!collectionName || !fieldNameBefore || !fieldNameAfter) {
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

      const tableDescribe = await queryInterface.describeTable(collectionName);

      if (!tableDescribe[fieldNameBefore]) {
        return res.status(400).json({
          errors: 'Este campo não existe',
        });
      }

      await queryInterface.renameColumn(collectionName, fieldNameBefore, fieldNameAfter);

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
