import { Router } from 'express';
import loginRequire from '../middlewares/loginRequire';
import downloadController from '../controllers/downloadController';

const routes = new Router();

routes.get('/:collectionName', loginRequire, downloadController.index);

export default routes;
