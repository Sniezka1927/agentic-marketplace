import { config } from "./config";
import type { Database } from "./db/client";
import { createAuthService } from "./modules/auth/auth.service";
import { createTokenService } from "./modules/auth/token.service";
import { createCategoryRepository } from "./modules/categories/category.repository";
import { createCategoryService } from "./modules/categories/category.service";
import { createUserRepository } from "./modules/users/user.repository";
import { createUserService } from "./modules/users/user.service";
import { createMarketplaceClient } from "./x-marketplace";

export const createContainer = (db: Database) => {
  if (config.jwt.secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters long");
  }

  const userRepository = createUserRepository(db);
  const tokenService = createTokenService(config.jwt.secret, config.jwt.expiresIn);

  return {
    authService: createAuthService(userRepository, tokenService),
    userService: createUserService(userRepository),
    categoryService: createCategoryService(createCategoryRepository(db)),
    marketplaceClient: createMarketplaceClient(config.xMarketplace),
  };
};

export type Container = ReturnType<typeof createContainer>;
