const express = require('express');
const router = express.Router();
const dbManager = require('../manager/dbManager')
const apiManager = require('../manager/apiManager')

const db = new dbManager.dbManager();
const api = new apiManager.apiManager();


// Get bank balance of user
router.post("/getBal", (req,res)=>{
  db.getBank(req.body.uid).then(result=>{
    return res.json(result)
  })
})

// Search stock with stock code (sid)
router.post("/search", (req, res)=>{
  api.search(req.body.sid)
  .then(data => {return res.send(data)})
})

// Buy stock at current market price
router.post("/buy", (req, res)=>{
  const uid = req.body.uid;
  const sid = req.body.sid;
  const qty = req.body.qty;
  const cost = req.body.cost;

  // Check if qty is negative number
  if (qty <= 0){return res.json("NegQty")}

  // Check if user has enough credit
  db.getBank(uid).then(bal => {
    if (bal < cost){return res.json("Insufficient_fund")}
    else{
      db.getOwnedStock(uid, sid)
      .then(result=>{
        // Case 1: User does not have this stock
        if(result == -1){
          db.first_buy(uid, sid, qty, cost)
          .then(data=>{return res.json(data)})
        }else{
          // Case 2: User already has this stock
          db.buy(uid, sid, qty, cost)
          .then(data=>{return res.json(data)})
        }
      })
    }
  })
})

// Sell stock at current market price
router.post("/sell", (req, res)=>{
  const uid = req.body.uid;
  const sid = req.body.sid;
  const qty = req.body.qty;
  const sales = req.body.sales;

  // Check if qty is negative number
  if (qty <= 0){return res.json("NegQty")}

  // Get stock price
  db.sell(uid, sid, qty, sales)
  .then(data=>{return res.json(data)})
})


// Get stocks list of user, return -1 if empty
router.post("/getOwnedStocks", (req, res)=>{
  db.getAllOwnedStocks(req.body.uid)
  .then(data => {res.json(data)})
})

// Get balance sheet of user, return -1 if empty
router.post("/getStockList", (req, res)=>{
  db.getAllOwnedStocks(req.body.uid)
  .then(async (data) =>{
    // Calculate total market worth and profit for each stock
    for (let i = 0; i < data.length; i++){
      var cur_price = await api.getCurrPrice(data[i].sid)
      data[i].worth = data[i].qty * cur_price
      data[i].profit = Math.floor(data[i].worth - data[i].cost)
    }
    res.json(data)
  })
})

// Get market worth of all stocks of user
router.post("/getStockWorth", (req, res)=>{
  db.getAllOwnedStocks(req.body.uid)
  .then(async (data) => {
    let sum = 0;
    for (let i = 0; i < data.length; i++){
      var cur_price = await api.getCurrPrice(data[i].sid)
      sum += data[i].qty * cur_price
    }
    res.json(sum)
  })
})


// =============================== For Debug
router.post("/changeBal", (req, res)=>{
  const uid = req.body.uid
  const x = req.body.x
  db.changeBal(uid, x).then(result=>{
    res.json(result)
  })
})


module.exports = router;