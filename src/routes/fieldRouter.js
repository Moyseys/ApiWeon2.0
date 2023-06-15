import { Router } from 'express';
import loginRequire from '../middlewares/loginRequire';
import fieldController from '../controllers/fieldController';

const routes = new Router();

routes.get('/:collectionName', loginRequire, fieldController.show);
routes.post('/', loginRequire, fieldController.store);
routes.put('/', loginRequire, fieldController.update);
// routes.delete('/', loginRequire, fieldController.delete)

export default routes;
