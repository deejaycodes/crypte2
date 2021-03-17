const Sequelize = require('sequelize');
module.exports = new Sequelize('cryptedge', 'cryptedge_user', '', {
    host: 'localhost',
    dialect: 'mysql',
  
    pool: {
      max: 5,
      min: 0,
      idle: 10000
    },
  
});

// const Sequelize = require('sequelize');
// module.exports = new Sequelize('dephi', 'root', '', {
//     host: 'localhost',
//     dialect: 'mysql',
  
//     pool: {
//       max: 5,
//       min: 0,
//       idle: 10000
//     },
  
// });