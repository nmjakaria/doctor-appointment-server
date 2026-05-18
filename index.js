const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express")
const dotenv = require('dotenv')
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express()

dotenv.config();
app.use(cors())
app.use(express.json())

const PORT = process.env.SERVER_PORT;
const uri = process.env.MONGODB_URI

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        // await client.connect();
        const db = client.db("doctor-appointment");
        const doctorCollection = db.collection("doctor");
        const bookingCollection = db.collection("booking");
        // all api here

        // doctor
        app.get('/appointment', async (req, res) => {
            const result = await doctorCollection.find().toArray()
            res.json(result);
        })

        //fetch doctor by id
        app.get('/appointment/:id', async (req, res) => {
            const { id } = req.params;
            const result = await doctorCollection.findOne({ _id: new ObjectId(id) })
            res.json(result);
        })


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send("server is running fine")
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})