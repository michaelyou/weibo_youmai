
/*
 * GET users listing.
 */

/*
exports.list = function(req, res){
  res.send("respond with a resource");
};
*/
//User是一个描述数据的对象，即MVC架构的模型。与视图和控制器不同，模型是真正与数据打交道的工具，
//没有模型，网站就是只是一个外壳，不能发挥真实的作用，因此它是框架中最根本的部分

var mongodb = require('./db');

function User(user){
  this.name = user.name;
  this.password = user.password;
};
module.exports = User;


//对象实例的方法，用于将用户对象的数据保存到数据库中
User.prototype.save = function save(callback){
  //存入Mongodb的文档
  var user = {
    name: this.name,
    password: this.password,
  };
  mongodb.open(function(err, db){
    if(err){
      return callback(err);
    }
    //读取users集合
    db.collection('users', function(err, collection){
      if(err){
        mongodb.close();
        return callback(err);
      }
      //为name属性添加索引
      collection.ensureIndex('name', {unique: true});
      //写入user文档
      collection.insert(user, {safe: true}, function(err, user){
        mongodb.close();
        callback(err, user);
      });
    });
  });
};


//对象构造函数的方法，用于从数据库中查找指定的用户
User.get = function get(username, callback){
  mongodb.open(function(err, db){
    if(err){
      return callback(err);
    }
    //读取users集合
    db.collection('users', function(err, collection){
      if(err){
        mongodb.close();
        return callback(err);
      }
      //查找name属性为username的文档
      collection.findOne({name: username}, function(err, doc){
        mongodb.close();
        if(doc){
          //封装文档为User对象
          var user = new User(doc);
          callback(err, user);
        }else{
          callback(err, null);
        }
      });
    });
  });
};












