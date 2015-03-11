
/*
 * GET home page.
 */
var crypto = require('crypto');
var User = require('../models/user.js');
var Post = require('../models/post.js');

module.exports = function(app){
  app.get('/', function(req, res){
    Post.get(null, function(err, posts){
      if(err){
        posts = [];
      }
      res.render('index',{
        title: '首页',
	posts: posts,        //读取所有用户的微博，传递给页面posts属性
      });
    });
  });

  app.get('/reg', checkNotLogin);
  app.get('/reg', function(req, res){
    res.render('reg', {
      title: '用户注册',
    });
  });

  app.post('/reg', checkNotLogin);
  app.post('/reg', function(req, res){
    //檢驗用戶兩次輸入的口令是否一致
    //req.body就是POST请求信息解析过后的对象
    if(req.body['password-repeat'] != req.body['password']){
      req.flash('error', '两次输入的密码不一致'); //用flash实现页面的通知和错误信息显示
      return res.redirect('/reg');
    }

    // 生成密码的散列值
    // crypto是Node.js的核心模块，功能是加密并生成各种散列
    var md5 = crypto.createHash('md5'); 
    var password = md5.update(req.body.password).digest('base64');
    
    //User使我们设计的用户对象
    var newUser = new User({
      name: req.body.username,
      password: password,
    });

    //检查用户名是否存在
    //User.get通过用户名获取已知用户
    User.get(newUser.name, function(err, user){
      if(user)
        err = 'Username already exists.';
      if(err){
        req.flash('error', err);
        return res.redirect('/reg');
      }
      //如果不存在则新增用户
      //User.save可以将用户的修改写入数据库
      newUser.save(function(err){
        if(err){
          req.flash('error', err);
          return res.redirect('/reg');
        }
        //向会话对象写入了当前用户的信息，在后面我们会通过它判断用户是否已登录
        req.session.user = newUser;
        req.flash('success', '注册成功');
        res.redirect('/');
      });
    });
  });

  app.get('/login', checkNotLogin);
  app.get('/login', function(req, res){
    res.render('login', {
      title: '用户登入',
    });
  });

  app.post('/login', checkNotLogin);
  app.post('/login', function(req, res){
    //生成口令的散列值
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.password).digest('base64');

    User.get(req.body.username, function(err, user){
      if(!user){
        req.flash('error', '用户不存在');
	return res.redirect('/login');
      }
      if(user.password != password){
        req.flash('error', '用户密码错误');
	return res.redirect('/login');
      }
      req.session.user = user;   //登入和登出仅仅是req.session.user变量的标记
      req.flash('success', '登入成功');
      res.redirect('/');
    });
  });

  app.get('/logout', checkLogin);
  app.get('/logout', function(req, res){
    req.session.user = null;
    req.flash('success', '登出成功');
    res.redirect('/');
  });

  //用户页面的功能是展示用户发表的所有内容
  app.get('/u/:user', function(req, res){
    User.get(req.params.user, function(err, user){
      if(!user){
        req.flash('error', '用户不存在');
        return res.redirect('/');
      }
      Post.get(user.name, function(err, posts){
      	if(err){
	  req.flash('error', err);
	  return res.redirect('/');
	}
	res.render('user', {
	  title: user.name,
	  posts: posts     //通过posts属性将从数据库中获取的该用户的微博传递给user视图
	});
      });
    });
  });
 
 //通过POST方式访问/post以发表微博
 //通过req.session.user获取当前用户的信息，从req.body.post获取用户发表的内容，建立
 //post对象，调用save()方法存储信息，最后将用户重定向到用户页面，用户页面用于展示
 //用户发表的所有内容
  app.post('/post', checkLogin);
  app.post('/post', function(req, res){
    var currentUser = req.session.user;
    var post = new Post(currentUser.name, req.body.post);
    post.save(function(err){
      if(err){
        req.flash('error', err);
	return res.redirect('/');
      }
      req.flash('success', '发表成功');
      res.redirect('/u/'+currentUser.name);
    });
  });
};

//路由中间件
//我们把用户登入状态检查放到路由中间件中，在每个路径前增加路由中间件，即可
//实现页面权限控制
function checkLogin(req, res, next){
  if(!req.session.user){
    req.flash('error', '未登录');
    return res.redirect('/');
  }
  next();
}

function checkNotLogin(req, res, next){
  if(req.session.user){
    req.flash('error', '已登入');
    return res.redirect('/');
  }
  next();
}

