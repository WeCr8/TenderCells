// index.routes.ts
import { Router } from "express";
import * as controller from "./index.controller";

const router = Router();

router.get("/", controller.index);

export default router;
