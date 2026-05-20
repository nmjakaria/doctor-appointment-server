const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express")
const dotenv = require('dotenv')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");

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

const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`))

const verifyToken = async (req, res, next) => {
    const authHeader = req?.headers.authorization
    if(!authHeader){
        return res.status(401).json({
            massage: "unauthorized"
        });
    }
    const token = authHeader.split(" ")[1]
    if(!token){
        return res.status(401).json({
            massage: "unauthorized"
        });
    }
    try {
        const {payload} = await jwtVerify(token, JWKS);
        next()
        
    } catch (error) {
        return res.status(403).json({
            massage: "Forebidden"
        })
    }
    
}
//main function
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
        app.get('/appointment/:id', verifyToken ,async (req, res) => {
            const { id } = req.params;
            const result = await doctorCollection.findOne({ _id: new ObjectId(id) })
            res.json(result);
        })
        //fetch doctor by rating
        app.get('/rated-doctor', async (req, res) => {
            try {
                const result = await doctorCollection
                    .find()
                    .sort({ rating: -1 })
                    .limit(3)
                    .toArray();

                res.json(result);
            } catch (error) {
                console.error("Error fetching top doctors:", error);
                res.status(500).json({ message: "Internal Server Error" });
            }
        });

        //booking
        app.post('/booking', verifyToken, async (req, res) => {
            const bookingData = req.body;
            const result = await bookingCollection.insertOne(bookingData);
            res.json(result);
        })
        //get booking data
        app.get('/booking/:userId', async (req, res) => {
            const { userId } = req.params;
            const resut = await bookingCollection.find({ userId: userId }).toArray();
            res.json(resut);
        })

        //booking data update
        app.patch('/booking/:id', async (req, res) => {
            const { id } = req.params;
            const updateData = req.body;
            const result = await bookingCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData }
            )
            res.json(result)
        })

        //delete booking data
        app.delete('/booking/:id', async (req, res) => {
            const { id } = req.params;
            const result = await bookingCollection.deleteOne({ _id: new ObjectId(id) })
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