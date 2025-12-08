import {
  pgTable,
  uniqueIndex,
  pgEnum,
  varchar,
  timestamp,
  integer,
  bigint,
  text,
  serial,
  json,
  unique,
  boolean,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  first_name: varchar("first_name").notNull(),
  last_name: varchar("last_name").notNull(),
  email: varchar("email").notNull(),
  dob: timestamp("dob").notNull(),
  gender: varchar("gender").notNull(),
  pfp: varchar("pfp").default(""),
  bio: text("bio").notNull(),
  hobbies: json("hobbies").default([]),
  interests: json("interests").default([]),
  user_prompts: json("user_prompts").default([]),
  personality_traits: json("personality_traits").default({}),
  photos: json("photos").default([]),
  is_verified: boolean("is_verified").default(false),
  address: json("address").notNull().default({}),
  extra: json("extra").default({}),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().notNull(),
  she_id: varchar("she_id").notNull(),
  he_id: varchar("he_id").notNull(),
  score: integer("score").notNull(),
  post_unlock_rating: json("post_unlock_rating").default({}),
  is_unlocked: boolean("is_unlocked").default(false),
  matched_at: timestamp("matched_at").defaultNow().notNull(),
});

export const chats = pgTable("chats", {
  id: varchar("id").primaryKey().notNull(),
  match_id: varchar("match_id").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  messages: json("messages").default([]),
});

export const posts = pgTable(
  "posts",
  {
    id: varchar("id").primaryKey().notNull(),
    user_id: varchar("user_id").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    content: text("content").notNull(),
    media: json("media").default([]),
    likes: integer("likes").default(0),
    comments: integer("comments").default(0),
    views: integer("views").default(0),
  },
  (table) => ({
    postsUserIdIdx: index("idx_posts_user_id").on(table.user_id),
    postsCreatedAtIdx: index("idx_posts_created_at").on(table.created_at),
  }),
);

export const comments = pgTable(
  "comments",
  {
    id: varchar("id").primaryKey().notNull(),
    post_id: varchar("post_id").notNull(),
    reply_to_id: varchar("reply_to_id").notNull(),
    user_id: varchar("user_id").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    content: text("content").notNull(),
    likes: integer("likes").default(0),
  },
  (table) => ({
    commentsPostIdIdx: index("idx_comments_post_id").on(table.post_id),
    commentsReplyToIdIdx: index("idx_comments_reply_to_id").on(
      table.reply_to_id,
    ),
  }),
);

export const user_files = pgTable("user_files", {
  id: varchar("id").primaryKey().notNull(),
  uid: varchar("uid").notNull(),
  key: varchar("key").notNull(),
  s3_path: varchar("s3_path").notNull(),
  visibility: varchar("visibility").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const user_profile_activities = pgTable("user_profile_activities", {
  id: varchar("id").primaryKey().notNull(),
  user_id: varchar("user_id").notNull(),
  type: varchar("type").notNull(), // "poke", "view", "superlike"
  target_id: varchar("target_id").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const swipes = pgTable("swipes", {
  id: varchar("id").primaryKey().notNull(),
  user_id: varchar("user_id").notNull(),
  target_id: varchar("target_id").notNull(),
  action_type: varchar("action_type").notNull(), // "like", "superlike", "dislike"
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().notNull(),
  user_id: varchar("user_id").notNull(),
  target_id: varchar("target_id").notNull(), // user_id, post_id, comment_id
  reason: varchar("reason").notNull(),
  additional_info: varchar("additional_info").notNull(),
  media: json("media").default([]),
  status: varchar("status").notNull(), // "pending", "resolved", "rejected"
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const aichat_chats = pgTable("aichat_chats", {
  id: varchar("id").primaryKey().notNull(),
  user_id: varchar("user_id").notNull(),
  messages: json("messages").default([]),
  title: varchar("title").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const user_verifications = pgTable("user_verifications", {
  id: varchar("id").primaryKey().notNull(),
  user_id: varchar("user_id").notNull(),
  media: json("media").default([]),
  status: varchar("status").notNull(), // "pending", "verified", "failed"
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
