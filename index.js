const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://root:root123@cluster0.7co24xu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
let db= null
async function run() {
      // Connect the client to the server	(optional starting in v4.7)
      await client.connect();
      // Send a ping to confirm a successful connection
      
      db= client.db("social-system");
      console.log("成功");
};
run();

//網站伺服器基礎設定
const express= require("express");
const app= express();
const session = require("express-session");
app.use(session({
    secret:"abcdef",
    resave:false,
    saveUninitialized:true
    }));
    
app.set("view engine", "ejs");
app.set("views", "./views");
//將靜態檔案名稱 對應到網址 http://localhost:3000/檔案名稱
app.use(express.static("public"));
//讓程式後端支援POST方法 
app.use(express.urlencoded({extended:true}));

app.get("/", function(req, res){
    res.render("index.ejs");
    }); 

app.post("/signup", async function(req, res){
        const name= req.body.name; 
        const email= req.body.email; 
        const password= req.body.password;        
        //檢查資料庫中的資料
        const collection= db.collection("member")
        let result= await collection.findOne({
            email:email
        });
        if (result!==null){ //email已經存在
            res.redirect("/error?msg=註冊失敗，信箱重複");
            return;
        }
        //將新的資料 放入資料庫
        result= await collection.insertOne({
            name:name,
            email:email,
            password:password
        });  
        //新增成功~  
        res.redirect("/");
            
    }); 

app.post("/signin", async function(req, res){
        const email= req.body.email; 
        const password= req.body.password; 
        const collection= db.collection("member")
        let result= await collection.findOne({$and:[
    
            { email:email},  
            {password:password}
        ] 
           
        });
        if (result!==null){
            console.log(result.name)
            //登入成功 記錄會員資訊 在session中
            req.session.member= result;
            res.redirect("/member");
        }else{
            res.redirect("/error?msg=帳號或密碼錯誤");
        }
    
    
    });

app.post("/signout", function(req, res){
        req.session.destroy();
        //也可以用 req.session.member= null
        res.redirect("/");
        });

//會員頁面要能夠支援 留言功能
app.get("/member",async function(req, res){
    if(!req.session.member){//擋沒有登入的人
        console.log("沒有註冊的人 入侵！！")
        res.redirect("/");
        return;
        }
            //從session取得登入會員的名稱
    member= req.session.member;
            //取得所有會員的名稱
    const collection= db.collection("messages");
    //取得留言內容
    let result= await collection.find({}).sort({timestamp:-1});

    let messages=[];
    await result.forEach(element => {
        messages.push(element);
     });
    res.render("member.ejs", {messages:messages, name:member.name});
            
    });

app.post("/leave-message",async function(req, res){
    
        const name=req.session.member.name; 
        const message= req.body.message;
        const collection= db.collection("messages")
        
        let date_ob= new Date();
        let date = ("0" + date_ob.getDate()).slice(-2);
    // current month
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    // current year
    let year = date_ob.getFullYear();
    // current hours
    let hours = date_ob.getHours();
    // current minutes
    let minutes = date_ob.getMinutes();
    // current seconds
    let seconds = date_ob.getSeconds();
    let cur_time= year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;
    result= await collection.insertOne({
        name:name,
        message:message,
        timestamp: cur_time
    });
    res.redirect("/member");
});  

app.listen(3000, function(){
        console.log("Server started");
    });
        