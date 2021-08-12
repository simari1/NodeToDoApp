const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
const url = process.env.CUSTOMCONNSTR_mongodburl;
let db;
let sanitizeHTML = require("sanitize-html");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

mongoClient.connect(url, function (err, client) {
  db = client.db("ToDoApp");
  app.listen(port, () => console.log(`Example app listening on port port!`));
});

//https://qiita.com/hiroyky/items/a16dc3315b06fd04c72a
const basicAuth = require("express-basic-auth");
// 本来はDBから取得
const correctUserName = "simari";
const correctPassword = "password";
const options = {
  challenge: true,
  unauthorizedResponse: () => {
    return "Unauthorized";
  },
  authorizer: (username, password) => {
    const userMatch = basicAuth.safeCompare(username, correctUserName);
    const passMatch = basicAuth.safeCompare(password, correctPassword);

    return userMatch & passMatch;
  },
};

// これをすると全体にかかる
// https://github.com/LionC/express-basic-auth/issues/14
app.use(basicAuth(options));

app.get("/logout", function (req, res) {
  res.set("WWW-Authenticate", 'Basic realm="tutorial"');
  res.redirect("/");
  return res.sendStatus(401);
});

app.get("/", (req, res) => {
  db.collection("items")
    .find()
    .toArray(function (err, items) {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Simple To-Do App</title>
          <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.2.1/css/bootstrap.min.css" integrity="sha384-GJzZqFGwb1QTTN6wy59ffF1BuGJpLSa9DkKMp0DgiMDm4iYMj70gZWKYbI706tWS" crossorigin="anonymous">
        </head>
        
        <body>
        <a href="/logout">logout</a>
          <div class="container">
            <h1 class="display-4 text-center py-1">To-Do App</h1>
            
            <div class="jumbotron p-3 shadow-sm">
              <form id="create-form">
                <div class="d-flex align-items-center">
                  <input id="create-field" name="item" autofocus autocomplete="off" class="form-control mr-3" type="text" style="flex: 1;">
                  <button class="btn btn-primary">Add New Item</button>
                </div>
              </form>
            </div>
            
            <ul id="item-list" class="list-group pb-5">

            </ul>
          </div>
          <script>
            let todoItems = ${JSON.stringify(items)}
          </script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/2.3.0/purify.min.js" integrity="sha512-FJzrdtFBVzaaehq9mzbhljqwJ7+jE0GyTa8UBxZdMsMUjflR25f5lJSGD0lmQPHnhQfnctG0B1TNQsObwyJUzA==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
          <script src="https://code.jquery.com/jquery-3.6.0.min.js" integrity="sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=" crossorigin="anonymous"></script>
          <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
          <script src="/browser.js"></script>
        </body>
        </html>
      `);
    });
});

app.post("/create-item", function (req, res) {
  let safeText = sanitizeHTML(req.body.text, {
    allowedTags: [],
    allowedAttributes: [],
  });
  db.collection("items").insertOne({ text: safeText }, function (err, info) {
    res.json(info.insertedId);
  });
});

app.post("/update-item", function (req, res) {
  let safeText = sanitizeHTML(req.body.text, {
    allowedTags: [],
    allowedAttributes: [],
  });
  db.collection("items").findOneAndUpdate(
    { _id: new mongodb.ObjectId(req.body.id) },
    { $set: { text: safeText } },
    function () {
      res.redirect("/");
    }
  );
});

app.post("/delete-item", function (req, res) {
  db.collection("items").deleteOne(
    { _id: new mongodb.ObjectId(req.body.id) },
    function () {
      res.redirect("/");
    }
  );
});
