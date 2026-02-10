const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// --- CORS CONFIGURATION UPDATE ---
app.use(cors({
    origin: [
        'http://localhost:5175', // Local development er jonno
        'https://rshk-game.vercel.app' 
    ],
    credentials: true
}));
app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});

let scoresCollection;

async function run() {
  try {
    // MongoDB Connect hobe
    await client.connect(); 
    const db = client.db("shk-games");
    scoresCollection = db.collection("scores");

    console.log("Successfully connected to MongoDB!");

    // 1. Save or Update Score API (POST)
    // 1. Save or Update Score API (POST)
app.post('/api/save-score', async (req, res) => {
    try {
        const data = req.body;
        const query = { playerEmail: data.email };
        const updateDoc = {
            $set: {
                playerName: data.name,
                playerEmail: data.email,
                playerPhoto: data.photo,
                lastUpdated: new Date()
            },
            $max: {
                playerScore: data.score 
            }
        };

        const result = await scoresCollection.updateOne(query, updateDoc, { upsert: true });
        res.send(result);
    } catch (error) {
        console.error("Save Score Error:", error);
        res.status(500).send({ message: "Failed to save score" });
    }
});
    // 2. Leaderboard Fetch API (GET)
    app.get('/all-scores', async (req, res) => {
      try {
        if (!scoresCollection) return res.status(500).send({ message: "DB not ready" });
        const result = await scoresCollection.find().sort({ playerScore: -1 }).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Fetch failed" });
      }
    });

    // 3. Delete Player API (DELETE)
    app.delete('/score/:id', async (req, res) => {
        try {
            const id = req.params.id;
            const { email, pass } = req.query;

            if (email !== process.env.ADMIN_EMAIL || pass !== process.env.ADMIN_PASS) {
                return res.status(403).send({ message: "Unauthorized!" });
            }

            const result = await scoresCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        } catch (error) {
            res.status(500).send({ message: "Delete failed" });
        }
    });

  } catch (error) {
    console.error("Critical Connection Error:", error);
  }
}
run().catch(console.dir);

app.get('/', (req, res) => res.send('SHK Games Server Running'));
app.listen(port, () => console.log(`Server listening on port ${port}`));