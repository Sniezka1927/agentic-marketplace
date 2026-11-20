import { config } from "./config";
import type { Database } from "./db/client";
import { createCategoryRepository } from "./modules/categories/category.repository";
import { createCategoryService } from "./modules/categories/category.service";
import { createMarketplaceClient } from "./x-marketplace";

export const createContainer = (db: Database) => ({
  categoryService: createCategoryService(createCategoryRepository(db)),
  marketplaceClient: createMarketplaceClient(config.xMarketplace),
});

export type Container = ReturnType<typeof createContainer>;
