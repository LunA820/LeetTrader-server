const mysql = require('mysql')

class dbManager{
  constructor(){
    this.db = mysql.createConnection({
      host: 'leettrader.cevjityxr5me.us-east-2.rds.amazonaws.com',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DATABASE
    })
  }

  // Register new user
  register(name, email, pw, res){
    let q = 'INSERT INTO users SET ?'
    this.db.query(q, {name: name, email: email, password: pw }, async(err, result)=>{
      if (err){res.json(-1)}
      res.json("success") 
    })
  }

  // User login by email & password
  login(email, pw, res){
    let q = 'SELECT id FROM users WHERE email = ? AND password = ?'
    this.db.query(q, [email, pw], async(err, result)=>{
      if (err){console.log(err)}
      if (result.length==0){res.json(-1)}
      else{res.json(result[0].id)}
    })
  }

  // Get user bank balance
  getUserBal(uid, res){
    let q = `SELECT bal FROM users where id = ${uid}`
    this.db.query(q, async(err, result)=>{
      if (err){res.json(false)}
      res.json(result[0].bal)
    })
  }

  // User buy a stock with sid at the first time
  first_buy(uid, sid, qty, cost){
    return new Promise((resolve, reject)=>{
      let q = "INSERT INTO ownedStocks(uid, sid, qty, cost) "
      q += `VALUES (${uid}, "${sid}", ${qty}, ${cost});`
      
      this.db.query(q, (err, result)=>{
        if (err) {return resolve(false)}
        this.changeBal(uid, -cost)
        return resolve(true)
      })})
  }

  // User buy more stock with sid
  buy(uid, sid, qty, cost){
    return new Promise((resolve, reject)=>{
      // Update qty and cost of the entry of owned stock with uid and sid
      this.getOwnedStock(uid, sid)
      .then(result=>{
        let new_qty = qty+result.qty;
        let new_cost = cost+result.cost;
        let q2 = "UPDATE ownedStocks SET ";
        q2 += `qty = ${new_qty}, cost = ${new_cost} WHERE id = ${result.id}`;

        this.db.query(q2, (err, result2)=>{
          if (err){return resolve(false)}
          this.changeBal(uid, -cost)
          return resolve(true)
        })          
      })
    })
  }

  // User sell stock
  sell(uid, sid, qty, sales){
    return new Promise((resolve, reject)=>{
      this.getOwnedStock(uid, sid)
      .then(result=>{
        // User does not have enough of this stock
        if (result === -1){return resolve(false)}
        if (result.qty < qty){return resolve(false)}

        // Sell all stocks
        if (result.qty == qty){
          let q = `DELETE FROM ownedStocks where uid = ${uid} AND sid = "${sid}"`
          this.db.query(q, (err, result)=>{
            if (err){return resolve(false)}
            this.changeBal(uid, sales)
            return resolve(true)
          })
        }
        else{
          // Sell stock
          let new_qty = result.qty - qty;
          let new_cost = result.cost*(new_qty/result.qty);
          let q = "UPDATE ownedStocks SET ";
          q += `qty = ${new_qty}, cost = ${new_cost} WHERE id = ${result.id}`;

          this.db.query(q, (err, result)=>{
            if (err){return resolve(false)}
            this.changeBal(uid, sales)
            return resolve(true)
          })          
        }
      })
    })
  }



  // Change cash balance of user by x 
  changeBal(uid, x){
    return new Promise((resolve, rej)=>{
      this.getUser(uid).then(user =>{
        let original_bal = user.bal
        let new_bal = original_bal + x

        let q = "UPDATE users SET ";
        q += `bal = ${new_bal} WHERE id = ${uid}`;
        this.db.query(q, (err, result)=>{
          if (err){return resolve(-1)}
          return resolve("Success")
        })
      })
    })
  }

  // Get all owned stocks of user
  getAllOwnedStocks(uid){
    return new Promise((resolve, reject)=>{
      let q = `SELECT sid, qty, cost FROM ownedStocks WHERE uid = ${uid}`

      this.db.query(q, (err, result)=>{
        if(err) {return resolve(false)}
        if (result.length===0){return resolve(-1)}
        return resolve(result)
      })
    })
  }

  // Get User Information
  getUser(uid){
    return new Promise((resolve, reject) => {
      let q = `SELECT * FROM users WHERE id = ${uid}`
      this.db.query(q, (err, result)=>{
        if (err){return resolve(-1)}
        return resolve(result[0])
      })
    })
  }

  // Get the record of owned stock with sid of user
  getOwnedStock(uid, sid){
    return new Promise((resolve, reject) => {
      let q = `SELECT * FROM ownedStocks WHERE uid = ${uid} AND sid = "${sid}"`
      
      this.db.query(q, (err, result)=>{
        if (err) {return resolve(err)}
        if (result.length == 0){return resolve(-1)}
        return resolve(result[0])
      })
    })
  }
};


module.exports = {dbManager}