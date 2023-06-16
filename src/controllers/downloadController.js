import dotenv from 'dotenv';
import MongoDb from '../database/mongoDb';
import Permission from '../models/PermissionsModel';

dotenv.config();

class DownloadController {
  async index(req, res) {
    const existPermission = await Permission.checksPermission(req.userId, 'insert');

    if (!existPermission) {
      return res.status(400).json({
        errors: 'Este usuario não possui a permissao necessaria',
      });
    }

    const mongoDb = new MongoDb(req.company);
    await mongoDb.connect();

    try {
      const existDb = await mongoDb.existDb(req.company);

      if (!existDb) {
        return res.status(400).json({
          errors: 'O bancos de dados q ue vc esta tentando acessar não existe',
        });
      }

      const { collectionName } = req.params;

      if (!collectionName) {
        return res.status(400).json({
          errors: 'Envie os valores corretos',
        });
      }

      return res.status(200).json({
        success: 'Predefinição criada com sucesso',
      });
    } catch (e) {
      return res.status(400).json({
        errors: 'Ocorreu um erro inesperado',
      });
    } finally {
      mongoDb.close();
    }
  }
}

export default new DownloadController();
