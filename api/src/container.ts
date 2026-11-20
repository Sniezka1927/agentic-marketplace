import { config } from "./config";
import type { Database } from "./db/client";
import { createEventBus } from "./events/event-bus";
import { createAuthService } from "./modules/auth/auth.service";
import { createTokenService } from "./modules/auth/token.service";
import { createCategoryRepository } from "./modules/categories/category.repository";
import { createCategoryService } from "./modules/categories/category.service";
import { createInstallationRepository } from "./modules/installations/installation.repository";
import { createInstallationService } from "./modules/installations/installation.service";
import { createReviewRepository } from "./modules/reviews/review.repository";
import { createReviewService } from "./modules/reviews/review.service";
import { createTemplateRepository } from "./modules/templates/template.repository";
import { registerTemplateStatsHandlers } from "./modules/templates/template-stats.handlers";
import { createTemplateService } from "./modules/templates/template.service";
import { createUserRepository } from "./modules/users/user.repository";
import { createUserService } from "./modules/users/user.service";
import { createMarketplaceClient } from "./x-marketplace";

export const createContainer = (db: Database) => {
  if (config.jwt.secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters long");
  }

  const userRepository = createUserRepository(db);
  const categoryRepository = createCategoryRepository(db);
  const templateRepository = createTemplateRepository(db);
  const installationRepository = createInstallationRepository(db);
  const events = createEventBus();
  registerTemplateStatsHandlers(events, templateRepository);
  const tokenService = createTokenService(config.jwt.secret, config.jwt.expiresIn);

  return {
    events,
    authService: createAuthService(userRepository, tokenService),
    userService: createUserService(userRepository),
    categoryService: createCategoryService(categoryRepository),
    templateService: createTemplateService(templateRepository, categoryRepository),
    installationService: createInstallationService(
      installationRepository,
      templateRepository,
      events,
    ),
    reviewService: createReviewService(
      createReviewRepository(db),
      installationRepository,
      templateRepository,
      events,
    ),
    marketplaceClient: createMarketplaceClient(config.xMarketplace),
  };
};

export type Container = ReturnType<typeof createContainer>;
