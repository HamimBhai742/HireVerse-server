const express = require("express");
const app = express();
require("dotenv").config();
app.use(express.json());
app.use(express.urlencoded());
const port = process.env.PORT || 5000;
const cors = require("cors");
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = process.env.MONGO_URL;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const database = client.db("hireVerseDB");
    const jobCollection = database.collection("jobs");

    app.post("/add-job", async (req, res) => {
      const data = req.body;
      console.log(data);
      const result = await jobCollection.insertOne(data);
      res.send(result);
    });

    app.get("/my-posted-jobs/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await jobCollection.find(query).toArray();
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("HireVerse Server Is Running.................!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
