//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
//dotenv to access variables in .env
require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_ACCESS, {useNewUrlParser: true, useUnifiedTopology: true})

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const thingToDo1 = new Item ({
  name: "Welcome to your todoList"
});
const thingToDo2 = new Item ({
  name: "Hit the + Button to add a new item"
});
const thingToDo3 = new Item ({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [thingToDo1, thingToDo2, thingToDo3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);



app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
      } else {
        console.log("Successfully saved default items to DB");
      }
    });
    res.redirect("/");
  } else {
    res.render("list", {listTitle: "Today", newListItems: foundItems});
  }
  });
});



app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        })

        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing list
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
     }
    }
  })


});



app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;


  const item = new Item({
    name: itemName
  })

  if (listName === "Today"){
    item.save();

    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }

});



app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
      console.log("Successfully deleted default items from DB");
      res.redirect("/");
  }
});
} else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    })
  }
});




app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully");
});
