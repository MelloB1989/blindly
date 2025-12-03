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
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm/relations";

export const deviceStatus = pgEnum("device_status", ["inactive", "active"]);
export const deviceType = pgEnum("device_type", ["phone", "pendant"]);
export const taskStatus = pgEnum("task_status", [
  "cancelled",
  "completed",
  "in_progress",
  "pending",
  "failed",
  "scheduled",
  "deleted",
  "booted",
  "boot_failed",
  "backup_in_progress",
  "backup_completed",
  "backup_failed",
  "restore_in_progress",
  "restore_completed",
  "restore_failed",
]);
export const taskTypes = pgEnum("task_types", [
  "browser_agent",
  "research",
  "email_draft",
  "call_schedule",
  "meet_schedule",
]);
export const transcriptionStatus = pgEnum("transcription_status", [
  "failed",
  "done",
  "processing",
]);

export const audio = pgTable(
  "audio",
  {
    id: varchar("id").primaryKey().notNull(),
    userId: varchar("user_id").notNull(),
    deviceId: varchar("device_id").notNull(),
    timestamp: timestamp("timestamp", { mode: "string" }).notNull(),
    duration: integer("duration").notNull(),
    size: bigint("size", { mode: "number" }).notNull(),
    s3Url: varchar("s3_url").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
  },
  (table) => {
    return {
      pkey: uniqueIndex("audio_pkey").on(table.id),
    };
  },
);

export const contacts = pgTable(
  "contacts",
  {
    id: varchar("id").primaryKey().notNull(),
    userId: varchar("user_id").notNull(),
    name: varchar("name").notNull(),
    phone: varchar("phone").notNull(),
    email: varchar("email").notNull(),
    description: text("description").notNull(),
    relationship: varchar("relationship").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
  },
  (table) => {
    return {
      pkey: uniqueIndex("contacts_pkey").on(table.id),
    };
  },
);

export const conversationParticipants = pgTable(
  "conversation_participants",
  {
    id: varchar("id").primaryKey().notNull(),
    conversationId: varchar("conversation_id").notNull(),
    contactId: varchar("contact_id").notNull(),
    role: varchar("role").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
  },
  (table) => {
    return {
      pkey: uniqueIndex("conversation_participants_pkey").on(table.id),
    };
  },
);

export const conversations = pgTable(
  "conversations",
  {
    id: varchar("id").primaryKey().notNull(),
    userId: varchar("user_id").notNull(),
    audioId: varchar("audio_id").notNull(),
    status: transcriptionStatus("status").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    title: varchar("title").notNull(),
    type: varchar("type").notNull(),
  },
  (table) => {
    return {
      pkey: uniqueIndex("conversations_pkey").on(table.id),
    };
  },
);

export const devices = pgTable(
  "devices",
  {
    id: varchar("id").primaryKey().notNull(),
    userId: varchar("user_id").notNull(),
    deviceType: deviceType("device_type").notNull(),
    status: deviceStatus("status").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    lastUsedAt: timestamp("last_used_at", { mode: "string" }).notNull(),
  },
  (table) => {
    return {
      pkey: uniqueIndex("devices_pkey").on(table.id),
    };
  },
);

export const onboardingQuestions = pgTable(
  "onboarding_questions",
  {
    id: serial("id").primaryKey().notNull(),
    question: text("question").notNull(),
    options: json("options").notNull(),
  },
  (table) => {
    return {
      pkey: uniqueIndex("onboarding_questions_pkey").on(table.id),
    };
  },
);

export const onboardingResponses = pgTable(
  "onboarding_responses",
  {
    id: varchar("id").primaryKey().notNull(),
    userId: varchar("user_id").notNull(),
    questionId: integer("question_id").notNull(),
    answer: text("answer").notNull(),
    respondedAt: timestamp("responded_at", { mode: "string" }).notNull(),
  },
  (table) => {
    return {
      pkey: uniqueIndex("onboarding_responses_pkey").on(table.id),
    };
  },
);

export const reminders = pgTable(
  "reminders",
  {
    id: varchar("id").primaryKey().notNull(),
    userId: varchar("user_id").notNull(),
    conversationId: varchar("conversation_id"),
    reminder: text("reminder").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    remindAt: timestamp("remind_at", { mode: "string" }).notNull(),
  },
  (table) => {
    return {
      pkey: uniqueIndex("reminders_pkey").on(table.id),
    };
  },
);

export const tasks_groups = pgTable("tasks_groups", {
  id: varchar("id").primaryKey().notNull(),
  user_id: varchar("user_id").notNull(),
  description: text("description").notNull(),
  percentage_complete: integer("percentage_complete").notNull(),
  milestones: json("milestones").default([]).notNull(),
  title: varchar("title").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).notNull(),
});

export const tasks = pgTable(
  "tasks",
  {
    id: varchar("id").primaryKey().notNull(),
    userId: varchar("user_id").notNull(),
    reminderId: varchar("reminder_id"),
    conversationId: varchar("conversation_id"),
    task: varchar("task").notNull(),
    taskType: taskTypes("task_type").notNull(),
    taskApproved: boolean("task_approved").default(false),
    description: text("description"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    deadline: timestamp("deadline", { mode: "string" }).notNull(),
    status: taskStatus("status").notNull(),
    task_result: json("task_result").default([]),
    task_recording: varchar("task_recording").default(""),
    task_group_id: varchar("task_group_id")
      .notNull()
      .references(() => tasks_groups.id),
    task_schema: json("task_schema").default({}),
  },
  (table) => {
    return {
      pkey: uniqueIndex("tasks_pkey").on(table.id),
    };
  },
);

// export const integrations = pgTable("integrations", {
//   name: varchar("name"),
//   id: varchar("id").primaryKey().notNull(),
//   logo: varchar("logo"),
//   website: varchar("website"),
//   tools: json("tools").default({}),
// });

export const taskBrowsers = pgTable("task_browsers", {
  bid: varchar("bid").primaryKey().notNull(),
  uid: varchar("uid")
    .notNull()
    .references(() => users.id),
  taskId: varchar("task_id")
    .notNull()
    .references(() => tasks.id),
  status: taskStatus("status").notNull(),
  labels: json("labels").default([]).notNull(),
  browser_pod_ip: varchar("browser_pod_ip").notNull(),
  cdp_url: varchar("cdp_url").notNull(),
  vnc_password: varchar("vnc_password").notNull(),
});

export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().notNull(),
  user_id: varchar("user_id").notNull(),
  conversationId: varchar("conversation_id").notNull(),
  note: json("note").notNull(),
  note_title: varchar("note_title").notNull(),
  note_type: varchar("note_type").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).notNull(),
});

export const transcriptions = pgTable(
  "transcriptions",
  {
    id: varchar("id").primaryKey().notNull(),
    user_id: varchar("user_id").notNull(),
    audioId: varchar("audio_id").notNull(),
    conversationId: varchar("conversation_id").notNull(),
    transcribedText: text("transcribed_text").notNull(),
    summary: json("summary").notNull(),
    sentimentAnalysisResults: json("sentiment_analysis_results").notNull(),
    entities: json("entities").notNull(),
    chapters: json("chapters").notNull(),
    key_pharases: json("key_pharases").notNull(),
    transcript: json("transcript").default({}),
    languages: json("languages").default([]),
  },
  (table) => {
    return {
      pkey: uniqueIndex("transcriptions_pkey").on(table.id),
    };
  },
);

export const users = pgTable(
  "users",
  {
    id: varchar("id").primaryKey().notNull(),
    username: varchar("username").notNull(),
    email: varchar("email").notNull(),
    name: varchar("name").notNull(),
    phone: varchar("phone").notNull(),
    bio: text("bio").notNull(),
    profileImage: varchar("profile_image").notNull(),
    socials: json("socials").default([]),
    dateOfBirth: timestamp("date_of_birth", { mode: "string" }).notNull(),
    gender: varchar("gender").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    deviceId: varchar("device_id").notNull(),
    passwordHash: varchar("password_hash").notNull(),
    userType: varchar("user_type").default("app"),
    lyznFlowUserId: varchar("lyzn_flow_user_id").notNull(),
    lyznFlowPassword: varchar("lyzn_flow_password").notNull(),
    publisher_name: varchar("publisher_name").notNull(),
    publisher_logo: varchar("publisher_logo").notNull(),
    publisher_url: varchar("publisher_url").notNull(),
    publisher_email: varchar("publisher_email").notNull(),
    publisher_description: varchar("publisher_description").notNull(),
  },
  (table) => {
    return {
      pkey: uniqueIndex("users_pkey").on(table.id),
      usernameUnique: uniqueIndex("users_username_unique").on(table.username),
      emailUnique: uniqueIndex("users_email_unique").on(table.email),
      phoneUnique: uniqueIndex("users_phone_unique").on(table.phone),
      usersUsernameUnique: unique("users_username_unique").on(table.username),
      usersEmailUnique: unique("users_email_unique").on(table.email),
    };
  },
);

export const user_info = pgTable("user_info", {
  user_id: varchar("user_id").primaryKey().notNull(),
  professional_role: varchar("professional_role").notNull(),
  work_experience: varchar("work_experience").notNull(),
  organisation: varchar("organisation").notNull(),
  usage: varchar("usage").notNull(),
  permissions: json("permissions").notNull().default({
    microphone: false,
    contacts: false,
    calender: false,
    location: false,
    notifications: false,
    data_privacy: false,
  }),
  integrations: json("integrations").notNull().default([]),
});

export const agentToHumanPrompts = pgTable(
  "agent_to_human_prompts",
  {
    id: varchar("id").primaryKey().notNull(),
    uid: varchar("uid")
      .notNull()
      .references(() => users.id),
    agentId: varchar("agent_id").notNull(),
    taskId: varchar("task_id")
      .notNull()
      .references(() => tasks.id),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    status: varchar("status").default("pending").notNull(),
    question: varchar("question").notNull(),
    answer: varchar("answer"),
  },
  (table) => {
    return {
      pkey: uniqueIndex("agent_to_human_prompts_pkey").on(table.id),
    };
  },
);

export const aiConversations = pgTable(
  "ai_conversations",
  {
    id: varchar("id").primaryKey().notNull(),
    uid: varchar("uid")
      .notNull()
      .references(() => users.id),
    aid: varchar("aid").notNull(),
    cid: varchar("cid").notNull(),
    contexts: json("contexts").default([]),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    title: varchar("title").notNull(),
    context: varchar("context"),
    system_mgs: varchar("system_msg"),
    iid: varchar("iid"),
    chat: json("chat").default([]),
    files: json("files").default([]),
  },
  (table) => {
    return {
      pkey: uniqueIndex("ai_conversations_pkey").on(table.id),
    };
  },
);

export const support = pgTable("support", {
  id: varchar("id").primaryKey().notNull(),
  userPhone: varchar("user_phone").notNull(),
  userEmail: varchar("user_email").notNull(),
  subject: varchar("subject").notNull(),
  messages: json("messages").default([]),
  media: json("media").default([]).notNull(),
  status: varchar("status").default("open").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const integrationStore = pgTable("integration_store", {
  id: varchar("id").primaryKey().notNull(),
  uid: varchar("uid").notNull(),
  iid: varchar("iid").notNull(),
  store: json("store").default({}).notNull(),
  lastTopUpAt: timestamp("last_top_up_at").defaultNow(),
  creditBalance: varchar("credit_balance").notNull(),
  creditSpendHistory: json("credit_spend_history").default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  favorite: boolean("favorite").default(false).notNull(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().notNull(),
  uid: varchar("uid").notNull(),
  iid: varchar("iid").notNull(),
  amount: varchar("amount").notNull(),
  type: varchar("type").notNull(),
  status: varchar("status").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const user_files = pgTable("user_files", {
  id: varchar("id").primaryKey().notNull(),
  uid: varchar("uid").notNull(),
  key: varchar("key").notNull(),
  s3Path: varchar("s3_path").notNull(),
  visibility: varchar("visibility").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const review_store = pgTable("review_store", {
  id: varchar("id").primaryKey().notNull(),
  group_id: varchar("group_id").notNull(),
  rating: integer("rating").notNull(),
  count: integer("count").notNull(),
});

export const review = pgTable("review", {
  id: varchar("id").primaryKey().notNull(),
  review_store_id: varchar("review_store_id").notNull(),
  user_id: varchar("user_id").notNull(),
  rating: integer("rating").notNull(),
  comment: varchar("comment").notNull(),
});

export const agents = pgTable("agents", {
  workflow_id: varchar("workflow_id").notNull(),
  initial_chat_message: varchar("initial_chat_message").notNull(),
  name: varchar("name").notNull(),
  logo: varchar("logo").notNull(),
  website: varchar("website").notNull(),
  description: varchar("description").notNull(),
  dev_user_id: varchar("dev_user_id").notNull(),
  tags: json("tags").default([]),
  pricing: json("pricing").default({}),
  connections_required: json("connections_required").default([]),
  is_active: boolean("is_active").default(false),
  show_first_message: boolean("show_first_message").default(false),
  chat_id: varchar("chat_id").notNull(),
  chat_config: json("chat_config").default({}),
  is_approved: boolean("is_approved").default(false),
  approval_message: varchar("approval_message").notNull(),
  approved_at: timestamp("approved_at"),
  approved_by: varchar("approved_by").notNull(), // ai || Lyzn user id
  visibility: varchar("visibility").notNull(),
});

export const approval_jobs = pgTable("approval_jobs", {
  id: varchar("id").primaryKey().notNull(),
  workflow_id: varchar("workflow_id").notNull(),
  dev_user_id: varchar("dev_user_id").notNull(),
  status: varchar("status").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  approved_by: varchar("approved_by").notNull(), // ai || Lyzn user id
  approved_at: timestamp("approved_at"),
  rejected_at: timestamp("rejected_at"),
  rejected_by: varchar("rejected_by").notNull(), // ai || Lyzn user id
  admin_note: varchar("admin_note").notNull(),
  request_note: varchar("request_note").notNull(),
});

export const stealth_browser = pgTable("stealth_browser", {
  profile_id: varchar("profile_id").primaryKey().notNull(),
  status: varchar("status").notNull(),
  user_id: varchar("user_id").notNull(),
  current_cdp_url: varchar("current_cdp_url").notNull(),
  task_id: varchar("task_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const lyzn_chat_components = pgTable("lyzn_chat_components", {
  comp_id: varchar("comp_id").primaryKey().notNull(),
  comp_name: varchar("comp_name").notNull(),
  comp_description: varchar("comp_description").notNull(),
  comp_code: varchar("comp_code").notNull(),
  user_id: varchar("user_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const audioRelations = relations(audio, ({ one, many }) => ({
  user: one(users, {
    fields: [audio.userId],
    references: [users.id],
  }),
  device: one(devices, {
    fields: [audio.deviceId],
    references: [devices.id],
  }),
  conversations: many(conversations),
  transcriptions: many(transcriptions),
}));

export const usersRelations = relations(users, ({ many }) => ({
  audio: many(audio),
  contacts: many(contacts),
  conversations: many(conversations),
  devices: many(devices),
  onboardingResponses: many(onboardingResponses),
  reminders: many(reminders),
  tasks: many(tasks),
}));

export const devicesRelations = relations(devices, ({ one, many }) => ({
  audio: many(audio),
  user: one(users, {
    fields: [devices.userId],
    references: [users.id],
  }),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  user: one(users, {
    fields: [contacts.userId],
    references: [users.id],
  }),
  conversationParticipants: many(conversationParticipants),
}));

export const conversationParticipantsRelations = relations(
  conversationParticipants,
  ({ one }) => ({
    conversation: one(conversations, {
      fields: [conversationParticipants.conversationId],
      references: [conversations.id],
    }),
    contact: one(contacts, {
      fields: [conversationParticipants.contactId],
      references: [contacts.id],
    }),
  }),
);

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    conversationParticipants: many(conversationParticipants),
    user: one(users, {
      fields: [conversations.userId],
      references: [users.id],
    }),
    audio: one(audio, {
      fields: [conversations.audioId],
      references: [audio.id],
    }),
    reminders: many(reminders),
    tasks: many(tasks),
    transcriptions: many(transcriptions),
  }),
);

export const onboardingResponsesRelations = relations(
  onboardingResponses,
  ({ one }) => ({
    user: one(users, {
      fields: [onboardingResponses.userId],
      references: [users.id],
    }),
    onboardingQuestion: one(onboardingQuestions, {
      fields: [onboardingResponses.questionId],
      references: [onboardingQuestions.id],
    }),
  }),
);

export const onboardingQuestionsRelations = relations(
  onboardingQuestions,
  ({ many }) => ({
    onboardingResponses: many(onboardingResponses),
  }),
);

export const remindersRelations = relations(reminders, ({ one, many }) => ({
  user: one(users, {
    fields: [reminders.userId],
    references: [users.id],
  }),
  conversation: one(conversations, {
    fields: [reminders.conversationId],
    references: [conversations.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  reminder: one(reminders, {
    fields: [tasks.reminderId],
    references: [reminders.id],
  }),
  conversation: one(conversations, {
    fields: [tasks.conversationId],
    references: [conversations.id],
  }),
}));

export const transcriptionsRelations = relations(transcriptions, ({ one }) => ({
  audio: one(audio, {
    fields: [transcriptions.audioId],
    references: [audio.id],
  }),
  conversation: one(conversations, {
    fields: [transcriptions.conversationId],
    references: [conversations.id],
  }),
}));
