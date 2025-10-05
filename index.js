const express = require("express");
const app = express();
require("dotenv").config();
app.use(express.json());
app.use(express.urlencoded({extended: true}));
const port = process.env.PORT || 8000;
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const e = require("express");
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
    // await client.connect();
    const database = client.db("hireVerseDB");
    const jobCollection = database.collection("jobs");
    const bidsCollection = database.collection("bids");

    const form = `
    <form action="/prompt" method="POST">
 <textarea className="textarea" name="prompt"></textarea>
    <button type="submit">Generate </button>
     </form>
    `;

    //From
    app.get("/prompt", async (req, res) => {
      res.send(form);
    })

    //Gemini AI
    app.post("/prompt", async (req, res) => {
      const { prompt } = req.body;
      // const prompt = "Do you know Ramadhan";
      const result = await model.generateContent(prompt);
      console.log(result.response.text());
      res.send({data:result.response.text(),status:200});
      // res.send({ data: prompt, status: 200 });
    })

    //Posted job
    app.post("/add-job", async (req, res) => {
      const data = req.body;
      const result = await jobCollection.insertOne(data);
      res.send(result);
    });

    //bids job
    app.post("/apply-job", async (req, res) => {
      const data = req.body;
      const result = await bidsCollection.insertOne(data);
      res.send(result);
    });

    //counts
    app.get("/counts", async (req, res) => {
      const result = await jobCollection.estimatedDocumentCount();
      res.send({ count: result });
    });

    //all jobs
    app.get("/all-jobs", async (req, res) => {
      const ca = req.query.category;
      const se = req.query.search;
      const ord = req.query.order;
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      let query = {};
      if (
        ca === "Web Development" ||
        ca === "Graphics Design" ||
        ca === "Digital Marketing"
      ) {
        query = {
          category: {
            $regex: ca,
            $options: "i",
          },
        };
      } else if (se) {
        query = {
          job_title: {
            $regex: se,
            $options: "i",
          },
        };
      }
      let result = await jobCollection
        .find(query)
        .skip(page * size)
        .limit(size)
        .toArray();
      if (ord === "asc") {
        result.sort((a, b) => {
          const dateA = new Date(a.deadline.split("-").reverse().join("-"));
          const dateB = new Date(b.deadline.split("-").reverse().join("-"));
          return dateA - dateB;
        });
      } else if (ord === "desc") {
        result.sort((a, b) => {
          const dateA = new Date(a.deadline.split("-").reverse().join("-"));
          const dateB = new Date(b.deadline.split("-").reverse().join("-"));
          return dateB - dateA;
        });
      }
      const result2 = await jobCollection.find(query).toArray();
      res.send({ jobs: result, count: result2.length });
    });

    //job deatils
    app.get("/job/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobCollection.findOne(query);
      res.send(result);
    });

    //update-bid-request
    app.patch("/update-bid-request/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: data.status,
        },
      };
      const result = await bidsCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    //update-job
    app.put("/update-job/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: data,
      };
      const result = await jobCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    //update-job
    app.get("/update-job/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobCollection.findOne(query);
      res.send(result);
    });

    //my bids
    app.get("/my-bids/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await bidsCollection.find(query).toArray();
      res.send(result);
    });

    //bid request
    app.get("/bid-requests/:email", async (req, res) => {
      const email = req.params.email;
      const query = { buyer_email: email };
      const result = await bidsCollection.find(query).toArray();
      res.send(result);
    });

    //my posted job
    app.get("/my-posted-jobs/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await jobCollection.find(query).toArray();
      res.send(result);
    });

    //delete my posted job
    app.delete("/delete-job/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobCollection.deleteOne(query);
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
