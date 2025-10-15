const express = require("express");
const path = require("path");
const admin = require("firebase-admin");


const serviceAccount = require("./lyceumbankdataba-firebase-adminsdk-fbsvc-0ed628edce.json");


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://lyceumbankdataba-default-rtdb.firebaseio.com/"
});

const app = express();
const PORT = process.env.PORT || 3001;


app.use(express.static(path.join(__dirname, "/public/hothub/index.html")));


app.get("/api/test", (req, res) => {
  res.json({ status: "ok", message: "Server start..." });
});


app.listen(PORT, () => {
  console.log(`Server start on: http://localhost:${PORT}`);
});
