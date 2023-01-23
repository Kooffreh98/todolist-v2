

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const _ = require("lodash");

mongoose.connect('mongodb+srv://admin-paulkoof:Winterfell@todolist.sbhx4pg.mongodb.net/todolistDB');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
  name: "Cook food"
});

const item2 = new Item ({
  name: "Go to work"
});

const item3 = new Item ({
  name: "Prepare leave roaster"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({   //This schema is for creating new todolists and items on these lists
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);

        } else {
          console.log("these items have successfully been added");
        }

      });
      res.redirect("/");

    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

app.get("/:customListName", function (req, res) {
  const customList = _.capitalize(req.params.customListName);

  List.findOne({name: customList}, function (err, foundList) {   //this query checks if the customListName written in the browser already exists, if it doesn't it will create it and display it. If it does it will just display it
    if (!err) {
      if (!foundList) {
        //create a new List
        const list = new List ({
          name: customList,
          items: defaultItems
        });
        list.save();

        res.redirect("/" + customList)

      } else {
        //show an existing List
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }

    }

  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const nextItem = new Item ({
    name: itemName
  });

  //These "if" and "else" statements were to ensure that whatever nextItem that is created is save to the specific list it was written in
  if (listName === "Today") {
    //This will store the newItem in the "/" route where the listTitle and listName is "Today"
    nextItem.save();

    res.redirect("/");

  } else {
    //This is to store the newItem in the dynamic lists created using the express req.params
    List.findOne({name: listName}, function (err, foundList) {     //you must find the custom list which the newItem was created using the listName
      foundList.items.push(nextItem);                             //then you add the nextItem to the array, using the javascript method push
      foundList.save();                                          // then save the newItem
      res.redirect("/" + listName);                              // then you must redirect to the customListName and not the "/" route to immediately see the newItem that was added
    });

  }

});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;      //this const is to be able to tap into the specific list in which an item's checkbox was checked

  if (listName === "Today") {             //these if statements are to check if the item which checkbox was checked was from the the default list which name is Today
    Item.findByIdAndDelete(checkedItemId, function (err) {
      if (!err) {
        console.log("this entry has been deleted");
      }
    });
    res.redirect("/");
  }else {                    //in the else statement we searched through all the lists in the List model to find the list in which the items checkbox was checked
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function (err, foundList) {       //using the findOneAndUpdate method and the pull operator the specific list will be found and we will now redirect to that specific list's route
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }


});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
