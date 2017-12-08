var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var sys = require('util');
var oracledb = require('oracledb');
const uuidv1 = require('uuid/v1');
var format = require('date-format');

function insertionFiles(GUID, name, path, createTime, size){
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
		"INSERT INTO FILES (GUID, FILENAME, PATH, FILE_SIZE, CREATION_TIME) VALUES (:1, :2, :3,:4, TO_TIMESTAMP(:5,'YYYY-MM-DD HH24:MI:SS'))"
		  ,[GUID, name, path, size, createTime],
		  {autoCommit: true},
		  function(err, result)
		  {
			if (err) { console.error(err); return; }
			connection.close();
		  });
	  });
	

	var DAGR_GUID = uuidv1();
	insertionDAGR(DAGR_GUID, createTime, name); 
	insertionDAGRFile(DAGR_GUID, GUID);
	
}

function insertionDAGR(DAGR_GUID, createTime, DAGR_NAME){
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
		"INSERT INTO DAGR (GUID, DAGR_SIZE, NAME, CREATION_TIME) Values(:1, 0,:2 ,TO_TIMESTAMP(:3,'YYYY-MM-DD HH24:MI:SS'))", 
		[DAGR_GUID, DAGR_NAME, createTime],
		  {autoCommit: true},
		  function(err, result)
		  {
			if (err) { console.error(err); return; }
			connection.close();
		  });
	  });	
}

//Inserts DAGR to File in DAGRFILE table
// Also increments the size of the DAGR. Do not use 
function insertionDAGRFile(DAGR_GUID, FILE_GUID){
	
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
		"INSERT INTO DAGR_FILE (GUID_DAGR, GUID_FILE) VALUES(:1, :2)"
		  ,[DAGR_GUID, FILE_GUID],
		  {autoCommit: true},
		  function(err, result)
		  {
			if (err) { console.error(err); return; }
			connection.close();
		  });
	  });


		oracledb.getConnection(
		  {
			user          : "admin",
			password      : "admin",
			connectString : "localhost/XE"
		  },
		  function(err, connection)
		  {
			if (err) { console.error(err); return;}
			connection.execute(
			"SELECT DAGR_SIZE from DAGR WHERE GUID = :guid",[DAGR_GUID],
			  function(err, result)
			  {
				 var insert = result.rows[0];
				if (err) { console.error(err); return; }
					
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
						"UPDATE DAGR SET DAGR_SIZE = :1 WHERE GUID = :guid", 
						[insert+1, DAGR_GUID],
						  {autoCommit: true},
						  function(err1, result1)
						  {
							if (err) { console.error(err); return; }
							connection.close();
						  });
					  });
					connection.close();
				}
			);	
		});
}



function getDateTime(date) {

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;

}


app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
  res.render(path.join(__dirname, 'views/index.ejs'));
});

app.post('/upload', function(req, res){

  // create an incoming form object
  var form = new formidable.IncomingForm();

  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;

  // store all uploads in the /uploads directory
  form.uploadDir = path.join(__dirname, '/uploads');

  // every time a file has been uploaded successfully,
  // rename it to it's orignal name
  form.on('file', function(field, file) {
    fs.rename(file.path, path.join(form.uploadDir, file.name));
	fs.stat(file.path, function(err, stats) {
		//console.log();
		//console.log(format.asString('YYYY-MM-DD HH:MM:SS',stats["ctime"]));
		insertionFiles(uuidv1(), file.name, file.path, getDateTime(stats["ctime"]), stats["size"]);
		//console.log('filePath: '+file.path);
		//console.log('size: ' + stats["size"]);
		//console.log('fileName: '+file.name); 
		//console.log('timeCreated: '+ Math.floor(stats["ctime"]));
	});
	
  });
  

  // log any errors that occur
  form.on('error', function(err) {
    console.log('An error has occured: \n' + err);
  });

  // once all the files have been uploaded, send a response to the client
  form.on('end', function() {
    res.end('success');
  });
  // parse the incoming request containing the form data
  form.parse(req);

});
	


var server = app.listen(3000, function(){
  console.log('Server listening on port 3000');
});
