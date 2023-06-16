import { MongoClient } from 'mongodb';

import dotenv from 'dotenv';

dotenv.config();

class Mongo {
  constructor(database) {
    this.database = database;
    this.connection = null;
  }

  async connect() {
    if (!this.database) {
      return null;
    }
    try {
      const client = new MongoClient(`${process.env.MONGO_CONNECTION_STRING}/${this.database}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await client.connect();
      this.connection = client;

      return this.connection;
    } catch (error) {
      throw new Error(error);
    }
  }

  async existDb(databaseName) {
    try {
      if (!this.connection) return;
      const databasesList = (await this.connection.db().admin().listDatabases()).databases.map((vl) => vl.name);

      const exist = databasesList.includes(databaseName);

      return exist;
    } catch (error) {
      throw new Error('Ocorreu um erro inesperado');
    }
  }

  close() {
    try {
      this.connection.close();
    } catch (error) {
      throw new Error('Erro ao tentar fechar a conexão');
    }
  }

  async collectionExist(collectionName) {
    const collections = (await this.connection.db(this.database).listCollections().toArray()).map((collec) => collec.name);

    if (collections.includes(collectionName)) return true;
    return false;
  }
}

export default Mongo;
