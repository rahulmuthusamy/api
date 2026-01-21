
// module.exports = {
//   // jwt: {
//   //   secret: process.env.JWT_SECRET,
//   //   accessTokenExpire: '15m',
//   //   refreshTokenExpire: '7d',
//   // },
//   // db: {
//   //   url: process.env.DB_URL,
//   //   username: "root",
//   //   password: "password",
//   //   database: "cricket_auction_dev",
//   //   host: "127.0.0.1",
//   //   dialect: "mysql"
//   // },

//   "development": {
//     "username": "avnadmin",
//     "password": " ",
//     "database": "cricket_auction_dev",
//     "host": "mysql-3a34086d-rahulm-96a7.b.aivencloud.com:18227",
//     "dialect": "mysql"
//   },
//   "test": {
//     "username": "root",
//     "password": null,
//     "database": "database_test",
//     "host": "127.0.0.1",
//     "dialect": "mysql"
//   },
//   "production": {
//     "username": "root",
//     "password": null,
//     "database": "database_production",
//     "host": "127.0.0.1",
//     "dialect": "mysql"
//   }
// };

require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: 18223,
    dialect: "mysql"   
  },

  test: {
    username: "root",
    password: null,
    database: "database_test",
    host: "127.0.0.1",
    dialect: "mysql"
  },

  production: {
    username: "root",
    password: null,
    database: "database_production",
    host: "127.0.0.1",
    dialect: "mysql"
  }
};
