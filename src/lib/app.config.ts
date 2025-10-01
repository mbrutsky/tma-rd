export const config = {
  app: {
    name: "TaskManager",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    debug: process.env.NODE_ENV !== "production",
    timezone: "Europe/Moscow",
    locale: "ru-RU",
    defaultLanguage: "ru",
  },
  api: {
    // baseURL: "http://localhost:3000/api/",
    // timeout: 10000,
    // retryAttempts: 3,
    // retryDelay: 1000,
    // endpoints: {
    //   auth: "/auth",
    //   users: "/users",
    //   tasks: "/tasks",
    // },
  },
  support: {
    btnLink: "https://t.me/+79150257081"
  },
  seo: {
    title: '',
    description: '',
    faviconSrc: ''
  },

  // Экспериментальные функции
  features: {

  },

  // Отладка и логирование
  logging: {
    // level: process.env.NODE_ENV === "production" ? "error" : "debug",
    // enableConsole: process.env.NODE_ENV !== "production",
    // remoteEndpoint: "/api/logs",
    // maxLogSize: 1000,
  },
};

// ! To-Do
// Current user - in real app this would come from auth
// Анна Иванова   550e8400-e29b-41d4-a716-446655440001
// Максим Бруцкий 380a4cb2-c953-4d34-a00f-4f94c47adb31
// Алексей Петров 550e8400-e29b-41d4-a716-446655440002
export const currentUserId = "380a4cb2-c953-4d34-a00f-4f94c47adb31";