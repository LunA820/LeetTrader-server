const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv');


// Configure Env
dotenv.config({ path: './.env'});

// Configure Express
const app = express();
app.use(express.json());
app.use(cors());
const port = 5000;

// Define Routes
app.use('/auth', require('./routes/auth'))
app.use('/api', require('./routes/api'))
app.get("/", (req, res)=>{res.send("LeetTrader")})

app.listen(process.env.PORT || port, ()=>console.log(`Listening at ${port}`))