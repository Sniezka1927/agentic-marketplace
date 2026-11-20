import { relations, sql } from "drizzle-orm";
import {
  check,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["USER", "ADMIN"]);
export const templateStatus = pgEnum("template_status", [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
]);
export const templateSource = pgEnum("template_source", ["LOCAL", "X"]);
export const syncStatus = pgEnum("sync_status", [
  "RUNNING",
  "SUCCESS",
  "FAILED",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  role: userRole("role").notNull().default("USER"),
  ...timestamps,
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description").notNull().default(""),
  ...timestamps,
});

export const templates = pgTable(
  "templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description").notNull().default(""),
    templateUrl: text("template_url").notNull(),
    status: templateStatus("status").notNull().default("DRAFT"),
    source: templateSource("source").notNull().default("LOCAL"),
    externalId: varchar("external_id", { length: 100 }),
    externalAuthor: varchar("external_author", { length: 100 }),
    authorId: uuid("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    version: integer("version").notNull().default(1),
    installsCount: integer("installs_count").notNull().default(0),
    ratingAvg: doublePrecision("rating_avg").notNull().default(0),
    ratingCount: integer("rating_count").notNull().default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    unique("templates_source_external_id_unique").on(t.source, t.externalId),
    index("templates_status_idx").on(t.status),
    index("templates_category_idx").on(t.categoryId),
    index("templates_author_idx").on(t.authorId),
  ],
);

export const installations = pgTable(
  "installations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    templateId: uuid("template_id")
      .notNull()
      .references(() => templates.id, { onDelete: "restrict" }),
    installedAt: timestamp("installed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("installations_user_template_unique").on(t.userId, t.templateId),
    index("installations_template_idx").on(t.templateId),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    templateId: uuid("template_id")
      .notNull()
      .references(() => templates.id, { onDelete: "cascade" }),
    rating: smallint("rating").notNull(),
    comment: text("comment").notNull().default(""),
    ...timestamps,
  },
  (t) => [
    unique("reviews_user_template_unique").on(t.userId, t.templateId),
    index("reviews_template_idx").on(t.templateId),
    check("reviews_rating_range", sql`${t.rating} between 1 and 5`),
  ],
);

export const syncRuns = pgTable("sync_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  status: syncStatus("status").notNull().default("RUNNING"),
  imported: integer("imported").notNull().default(0),
  error: text("error"),
  triggeredById: uuid("triggered_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
});

export const usersRelations = relations(users, ({ many }) => ({
  templates: many(templates),
  installations: many(installations),
  reviews: many(reviews),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  templates: many(templates),
}));

export const templatesRelations = relations(templates, ({ one, many }) => ({
  author: one(users, {
    fields: [templates.authorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [templates.categoryId],
    references: [categories.id],
  }),
  installations: many(installations),
  reviews: many(reviews),
}));

export const installationsRelations = relations(installations, ({ one }) => ({
  user: one(users, {
    fields: [installations.userId],
    references: [users.id],
  }),
  template: one(templates, {
    fields: [installations.templateId],
    references: [templates.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  template: one(templates, {
    fields: [reviews.templateId],
    references: [templates.id],
  }),
}));

export const syncRunsRelations = relations(syncRuns, ({ one }) => ({
  triggeredBy: one(users, {
    fields: [syncRuns.triggeredById],
    references: [users.id],
  }),
}));
