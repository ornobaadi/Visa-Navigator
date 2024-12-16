const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xd8rz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

console.log(uri);


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
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const visaCollection = client.db('visaDB').collection('visa');

        const userCollection = client.db('visaDB').collection('users')

        app.get('/visa', async (req, res) => {
            const cursor = visaCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/visa/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await visaCollection.findOne(query);
            res.send(result);
        })

        // Fetch the six most recently added visas
        app.get('/latestSix', async (req, res) => {
            try {
                const cursor = visaCollection.find().sort({ _id: -1 }).limit(6);
                const result = await cursor.toArray();
                res.send(result);
            } catch (error) {
                console.error("Error fetching latest data:", error);
                res.status(500).send({ error: "Failed to fetch latest data" });
            }
        });


        app.post('/visa', async (req, res) => {
            const newVisa = req.body;
            console.log(newVisa);
            const result = await visaCollection.insertOne(newVisa);
            res.send(result)
        })

        app.patch('/users/:email', async (req, res) => {
            const email = req.params.email;
            const updatedUser = req.body;
            const filter = { email };
            const updateDoc = { $set: updatedUser };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        });


        app.put('/visa/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updateVisa = req.body;

            const visa = {
                $set: {
                    countryPhoto: updateVisa.countryPhoto,
                    countryName: updateVisa.countryName,
                    visaType: updateVisa.visaType,
                    processingTime: updateVisa.processingTime,
                    requiredDocuments: updateVisa.requiredDocuments,
                    description: updateVisa.description,
                    fee: updateVisa.fee,
                    validity: updateVisa.validity,
                    ageRestriction: updateVisa.ageRestriction,
                    applicationMethod: updateVisa.applicationMethod
                }
            }
            const result = await visaCollection.updateOne(filter, visa, options)
            res.send(result);
        })

        app.delete('/visa/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await visaCollection.deleteOne(query);
            res.send(result);
        })


        // Users related APIs\

        app.get('/users', async (req, res) => {
            const cursor = userCollection.find();
            const result = await cursor.toArray()
            res.send(result);
        })

        app.post('/users', async (req, res) => {
            const newUser = req.body;
            const query = { email: newUser.email }; // Check for existing email
            const existingUser = await userCollection.findOne(query);

            if (existingUser) {
                console.log('User already exists in the database');
                res.send({ message: 'User already exists', user: existingUser });
            } else {
                console.log('Creating new user', newUser);
                const result = await userCollection.insertOne(newUser);
                res.send({ message: 'User created', user: newUser, insertedId: result.insertedId });
            }
        });


        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await userCollection.deleteOne(query);
            res.send(result);
        })

        // Applied Collection
        const applicationCollection = client.db("visaDB").collection("applications");

        app.post("/applications", async (req, res) => {
            const application = req.body;
            const result = await applicationCollection.insertOne(application);
            res.send(result);
        });
        
        app.get("/applications", async (req, res) => {
            const { email } = req.query;
            const query = email ? { email } : {};
            const applications = await applicationCollection.find(query).toArray();
            res.send(applications);
        });
        
        app.delete("/applications/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await applicationCollection.deleteOne(query);
            res.send(result); // Respond with the result (deletedCount)
        });

        app.get("/visas/:id", async (req, res) => {
            const id = req.params.id;
            const visa = await visaCollection.findOne({ _id: new ObjectId(id) });
            res.send(visa);
        });




        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Visa Processing Server is running')
})

app.listen(port, () => {
    console.log(`Visa Server is running on port: ${port}`)
})