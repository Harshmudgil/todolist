const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { render } = require('ejs');
const _ = require('Lodash');
const app = express();
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static("public"))
app.set('view engine', 'ejs');

mongoose.set('strictQuery', true);
mongoose.connect("mongodb://localhost:27017/todolistDB")
const schema = mongoose.Schema({
  name: {
    type: String,
    required: true
  }
});
const Task = mongoose.model('Task', schema);
const task1 = new Task({
  name: 'Welcome to the to-do-list'
})
const task2 = new Task({
  name: 'Press + for adding Task'
})
const task3 = new Task({
  name: 'press <-- for deletion of task'
})

const defaultItems = [task1,task2,task3]

const listSchema = {
  name : String,
  TaskList : [schema]
}

const List = mongoose.model('List',listSchema);

app.get('/', function (req, res) {
  if (Task.length == 0) {
    Task.insertMany(defaultItems, function (err) {
      if (err) {
        console.log(err)
      }
      else {
        mongoose.connection.close()
        console.log("task added successfully")
      }
    });
    res.redirect("/");
  }else{
    Task.find({}, function (err, foundItems) {
      res.render("list", { current_day: 'Today', newItems: foundItems });
    });
  }
});

app.get("/:customList",function(req,res){
  const customList = _.capitalize(req.params.customList);
  List.findOne({name : customList},function(err,found){
    if(!err){
      if(!found){
        const list = new List({
          name : customList,
          TaskList : defaultItems
        });
         list.save();
        res.redirect("/" + customList);
      }
    else{
      res.render("list", { current_day : found.name, newItems: found.TaskList});
    }
  } 
  });
});


app.post("/",function(req,res){
  const Newtask = req.body.newtask;
  const NewList  = req.body.list;

  const list = new Task({
    name : Newtask
  });

  if(NewList == "Today"){
    Task.collection.insertOne({
     name : Newtask
    });
    res.redirect("/"); 
  }else{
    List.findOne({name : NewList},function(err,foundList){
    if(!err){
      foundList.TaskList.push(list)
      foundList.save();
      res.redirect("/"+NewList)
    }
    })
  }
})

app.post("/delete",function(req,res){
  const delete_id = req.body.checkbox;
  const listname = req.body.listname;
  if(listname == "today"){
    Task.deleteOne({_id : delete_id},function(err){
      if(!err){
        console.log("Successfully deleted")
      }
    });
    res.redirect("/")
  }else{
    List.findOneAndUpdate({name :listname},{$pull:{TaskList : {_id : delete_id}}},function(err, foundList){
     res.redirect("/"+listname);
    })

  }
  
})

app.listen(3000, function () {
  console.log("running on 3000 port");
});