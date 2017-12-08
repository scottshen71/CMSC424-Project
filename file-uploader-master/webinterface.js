var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var sys = require('util');
var oracledb = require('oracledb');
const uuidv1 = require('uuid/v1');
var format = require('date-format');
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended : false}));

app.get('/', function(req,res,next){
	oracledb.getConnection(
	  {
		user          : "admin",
		password      : "admin",
		connectString : "localhost/XE"
	  },
	  function(err, connection)
	  {
		if (err) { console.error(err); return; }
		
		connection.execute(
		 "SELECT * FROM DAGR"
		  ,
		  function(err, result)
		  {
			if (err) { console.error(err); return; }
			
			//gets something from the database is in list of lists format,
			//rows is key
			//req is the request from the get.
			req.dagr1 = result.rows[0];
			console.log(req.dagr1);
			connection.close();
			next();
		  });
		  
	  });
	
	
});


app.use(express.static(path.join(__dirname, 'public')));


app.get('/', function(req, res){
	res.render(path.join(__dirname,'views/webInterface.ejs'), {dagr1:req.dagr1});
});

app.post('/submit', function(req, res){
		//These are all the Query fields based off of names.
		//Most useful to Least is: GUID, File Name, Annotation, File Size, Timestamp
		console.log(req.body.GUID);
		console.log(req.body.fileName);
		console.log(req.body.File_Size);
		console.log(req.body.timeStamp);
		console.log(req.body.Anno);
		//this is for the time range query
		console.log(req.body.Range1);
		console.log(req.body.Range2);
	
});


var server = app.listen(3500, function(){
  console.log('Server listening on port 3500');
});
