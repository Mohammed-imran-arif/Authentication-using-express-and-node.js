const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();

const dbPath = path.join(__dirname, "userData.db");

app.use(express.json());

let db = null;
const initializationOfDbandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
initializationOfDbandServer();

//API 1 register
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 5);
  const selectUserQuery = `select * from user where username='${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    const createUserQuery = `insert into user(username,name,password,gender,location)
     values('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
    if (password.length >= 5) {
      const createUserToDB = await db.run(createUserQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2 login
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `select * from user where username='${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send(`Invalid user`);
  } else {
    const isMatchedPassword = await bcrypt.compare(password, dbUser.password);
    if (isMatchedPassword === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3 change password
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashedPassword1 = await bcrypt.hash(newPassword, 7);
  const selectUserQuery = `select * from user where username='${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isMatchedPassword = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isMatchedPassword === true) {
      if (newPassword.length > 5) {
        const createNewPassword = `update user set password ='${hashedPassword1}' where username='${username}';`;
        const addNewPassword = await db.run(createNewPassword);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
