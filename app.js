'use strict';

// Dependencies
const express = require('express');
const path = require('path');
const mongodb = require('mongodb');
const shortid = require('shortid');
const validUrl = require('valid-url');

const app = express();
const port = process.env.PORT || 9000;
const mLab = "mongodb://localhost:27017/url-shortener-microservice";
const MongoClient = mongodb.MongoClient;

// Middleware Functions
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.resolve(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

// The (*) piece  :url(*) parameter allows to pass in properly formatted links
app.get('/new/:url(*)', (req, res) => {
  MongoClient.connect(mLab, (err, db) => {
    if (err) {
      console.log("Unable to connect to server", err);
    } else {
      console.log("Connected to server");
      let collection = db.collection('links');
      let params = req.params.url;
      let local = req.get('host') + "/";

      let newLink = (db, callback) => {
        // check if URL is valid or not
        if (validUrl.isUri(params)) {
          // if URL is valid, generate short code
          let shortCode = shortid.generate();
          let newUrl = { url: params, short: shortCode };
          collection.insert([newUrl]);
          res.json({ original_url: params, short_url: local + shortCode });

        } else {
          // if URL is invalid
          res.json({ error: "Wrong url format, make sure you have a valid protocol and real site." });
        }
      };
      newLink(db, () => {
        db.close();
      });
    }
  });
});

app.get('/:short', (req, res, next) => {
  MongoClient.connect(mLab, (err, db) => {
    if (err) {
      console.log("Unable to connect to server", err);
    } else {
      console.log("Connected to server");

      let collection = db.collection('links');
      let params = req.params.short;

      let findLink = (db, callback) => {
        collection.findOne({ "short": params }, { url: 1, _id: 0 }, (err, doc) => {
          if (doc !== null) {
            res.redirect(doc.url);
          } else {
            res.json({ error: "No corresponding shortlink found in the database." });
          }
        });
      };
      findLink(db, () => {
        db.close();
      });
    }
  });
});

// Bootstrap app
app.listen(port, function () {
  console.log(`Server Starts on ${port}`);
});