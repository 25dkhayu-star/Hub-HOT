const express = require("express");
const path = require("path");
const admin = require("firebase-admin");

const serviceAccount = require("./lyceumbankdataba-firebase-adminsdk-fbsvc-0ed628edce.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://lyceumbankdataba-default-rtdb.firebaseio.com/"
});

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/hothub", express.static(path.join(__dirname, "/public/hothub")));
app.use("/site", express.static(path.join(__dirname, "/public/site")));
app.use("/bank", express.static(path.join(__dirname, "/public/bank")));


app.get("/", (req, res) => {
  res.redirect("/hothub"); 
});


app.get("/api/test", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Server started successfully!",
    timestamp: new Date().toISOString(),
    routes: {
      hothub: "/hothub",
      site: "/site", 
      bankhot: "/bank"
    }
  });
});


app.get("/api/routes", (req, res) => {
  res.json({
    availableRoutes: [
      { path: "/hothub", description: "Hothub static files" },
      { path: "/site", description: "Site static files" },
      { path: "/bank", description: "Bankhot static files" },
      { path: "/api/test", description: "API test endpoint" }
    ]
  });
});


app.use((req, res) => {
  res.status(404).json({ 
    error: "Route not found",
    available: ["/hothub", "/site", "/bank", "/api/test"]
  });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: "Something went wrong!",
    message: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`Server started on: http://localhost:${PORT}`);
  console.log(`Available routes:`);
  console.log(`   → http://localhost:${PORT}/hothub`);
  console.log(`   → http://localhost:${PORT}/site`); 
  console.log(`   → http://localhost:${PORT}/bank`);
  console.log(`   → http://localhost:${PORT}/api/test`);
  console.log(`   → http://localhost:${PORT}/api/routes`);
});