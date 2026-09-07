// lib/routes/auth.js — 认证路由

import { Router } from "express";
import { success, error, ErrorCode, BusinessError } from "../middleware/response.js";
import { login } from "../services/auth-service.js";

/**
 * 创建认证路由。
 * @param {Record<string, string>} env  context.env
 */
export function createAuthRouter(env) {
  const router = Router();

  // POST /v1/auth/login
  router.post("/login", async (req, res, next) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        throw new BusinessError(ErrorCode.VALIDATION_ERROR, "用户名和密码不能为空");
      }

      const token = await login(username, password, env);
      if (token === null) {
        return res.status(200).json(error(ErrorCode.UNAUTHORIZED, "用户名或密码错误"));
      }
      res.json(success({ token }));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
