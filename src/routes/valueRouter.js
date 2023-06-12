import { Router } from "express";
import loginRequire from "../middlewares/loginRequire";
import valueController from '../controllers/valueController'

const routes = new Router()

routes.get('/', loginRequire, valueController.index)
routes.post('/:tableName/', loginRequire, valueController.store)
routes.put('/:id/', loginRequire, valueController.update)
//routes.delete('/:id/', loginRequire, valueController.delete)

export default routes