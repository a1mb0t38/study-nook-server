const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
dotenv.config();
const uri = process.env.MONGODB_URI;

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

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
    await client.connect();

    const db = client.db("study-nook")
    const roomsCollection = db.collection("rooms")
    const bookingsCollection = db.collection("bookings")

    app.get('/rooms', async (req, res) => {
       const rooms = await roomsCollection.find().sort({ _id: -1}).limit(6).toArray();
       res.json(rooms);
    })

    app.get('/all-rooms', async (req, res) => {
      const rooms = await roomsCollection.find().toArray();
      res.json(rooms);
    })

    app.get('/room-details/:id', async (req, res) => {
      const {id} = req.params;
      const result = await roomsCollection.findOne({_id: new ObjectId(id)});
      res.json(result);
    })

    app.patch('/room-details/:id', async (req, res) => {
      const {id} = req.params;
      const updatedData = req.body;
      const result = await roomsCollection.updateOne(
        {_id: new ObjectId(id)},
        {$set: updatedData}
      )
      res.json(result);
    })

    app.delete('/room-details/:id', async (req, res) => {
      const {id} = req.params;
      const result = await roomsCollection.deleteOne({_id: new ObjectId(id)});
      res.json(result);
    })

    app.get('/booking/:userId', async (req, res) => {
      const {userId} = req.params;
      const result = await bookingsCollection.find({userId: userId}).toArray();
      res.json(result);
    })

    app.delete('/booking/:_id', async (req, res) => {
      const {_id} = req.params;
      const result = await bookingsCollection.deleteOne({_id: new ObjectId(_id)});
      res.json(result);
    })

    app.post('/booking', async (req, res) => {
      const bookingData = req.body;
      const {roomId, bookingDate, startTime, endTime} = bookingData;
      const newStart = Number(startTime.split(':')[0]);
      const newEnd = Number(endTime.split(':')[0]);
      const existingBookings = await bookingsCollection.find({roomId, bookingDate}).toArray();

      const isConflict = existingBookings.some(booking => {
        const existingStart = Number(booking.startTime.split(':')[0]);
        const existingEnd = Number(booking.endTime.split(':')[0]);
        return (newStart < existingEnd && newEnd > existingStart);
      })

      if(isConflict){
        return res.status(400).json({message: "Time slot is already booked. Please choose a different time."});
      }


      const result = await bookingsCollection.insertOne(bookingData);
      res.json(result);
    })

    app.post('/create-room', async (req, res) => {
        const newRoomData = req.body;
        // console.log(newRoomData);
        const result = await roomsCollection.insertOne(newRoomData);
        res.json(result);
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}
run().catch(console.dir);

app.get('/', (req, res)=>{
    res.send("Server is running");
})


app.listen(PORT, ()=>{
    console.log(`Server is running on ${PORT}`);
})