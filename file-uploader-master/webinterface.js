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
var http = require('http');


app.use(bodyParser.urlencoded({extended : false}));


app.use(express.static(path.join(__dirname, 'public')));


var wanted_result2= function buildSting(guid, filename, filesize, timestamp, annotation, obj , callback){

	var selectString = "SELECT d1.* FROM DAGR d1, DAGR_FILE df1, Files f1 WHERE (d1.GUID = df1.GUID_DAGR) and (df1.GUID_FILE = f1.GUID)"
	var bindVars = [];
	if(guid !== ""){
		selectString  = selectString + " and (d1.GUID = :guid)";
		bindVars.push(guid);
	}
	
	if(filename !== "") {
		selectString = selectString  +  " and (f1.FILENAME = :name)";
		bindVars.push(filename);
	}
	
	if(filesize !== "") {
		selectString = selectString + " and (f1.FILE_SIZE = :filesize)";
		bindVars.push(filesize);
	}
	
	if(timestamp !== ""){
		selectString = selectString + " and (f1.CREATION_TIME = TO_TIMESTAMP(:timeStamp,'YYYY-MM-DD HH24:MI:SS'))";
		bindVars.push(timestamp);
	}
	
	if(annotation !== ""){
		selectString = selectString + " and  (f1.Annotation = :anno)";
		bindVars.push(annotation);
	}
	
	oracledb.getConnection(
	  {
		user          : "admin",
		password      : "admin",
		connectString : "localhost/XE"
	  },
	  function(err, connection)
	  {
		if (err) { console.error(err); callback(); }
		
		connection.execute(
		 selectString, bindVars,
		  function(err, result)
		  {
			if (err) { console.error(err); callback(); }
			
			//gets something from the database is in list of lists format,
			//rows is key
			//req is the request from the get.
			resultSet = result.rows;
			headers = result.metaData;
			connection.close();
			for(i = 0; i < resultSet.length;i++){
				for(j = 0; j<resultSet[0].length;j++){
					obj.val1.push(resultSet[i][j]);
				}
			}
			

			for(k = 0; k < headers.length;k++){
				obj.val2.push(headers[k].name);
			}
			var newObj = new Object();
			newObj.row = obj.val1;
			newObj.head = obj.val2;
			callback(newObj);
		  });
		  
	  });
}


var wanted_result = function timeDAGR(start, end, obj,callback){
	oracledb.getConnection(
	  {
		user          : "admin",
		password      : "admin",
		connectString : "localhost/XE"
	  },
	  function(err, connection)
	  {
		if (err) { console.error(err); callback(); }
		if(start !== "" && end !== ""){
			connection.execute("SELECT * FROM DAGR WHERE CREATION_TIME >= TO_TIMESTAMP('" + start + "','YYYY-MM-DD HH24:MI:SS') and CREATION_TIME <= TO_TIMESTAMP('" + end +"','YYYY-MM-DD HH24:MI:SS')",
		  function(err, result)
		  {
			if (err) { console.error(err); callback(); }
			resultSet = result.rows;
			headers = result.metaData;
			connection.close();
			for(i = 0; i < resultSet.length;i++){
				for(j = 0; j<resultSet[0].length;j++){
					obj.val1.push(resultSet[i][j]);
				}
			}
			

			for(k = 0; k < headers.length;k++){
				obj.val2.push(headers[k].name);
			}
			var newObj = new Object();
			newObj.row = obj.val1;
			newObj.head = obj.val2;
			callback(newObj);
			
			});
		}
		else if(start !== "" && end === ""){
			connection.execute("SELECT * FROM DAGR WHERE CREATION_TIME >= TO_TIMESTAMP('" + start + "','YYYY-MM-DD HH24:MI:SS')",
			  function(err, result)
			  {
				if (err) { console.error(err); callback(); }
				resultSet = result.rows;
				headers = result.metaData;
				connection.close();
				for(i = 0; i < resultSet.length;i++){
				for(j = 0; j<resultSet[0].length;j++){
					obj.val1.push(resultSet[i][j]);
				}
			}
			
			for(k = 0; k < headers.length;k++){
				obj.val2.push(headers[k].name);
			}
			var newObj = {row:obj.val1,headings:obj.val2};
			callback(newObj);
			  });
		}
		else if(start === "" && end !== ""){
				connection.execute("SELECT * FROM DAGR WHERE CREATION_TIME <= TO_TIMESTAMP('" + end + "','YYYY-MM-DD HH24:MI:SS')",
			  function(err, result)
			  {
				if (err) { console.error(err); callback(); }
				resultSet = result.rows;
				headers = result.metaData;
				connection.close();
			for(i = 0; i < resultSet.length;i++){
				for(j = 0; j<resultSet[0].length;j++){
					obj.val1.push(resultSet[i][j]);
				}
			}
			for(k = 0; k < headers.length;k++){
				console.log(headers[k].name);	
				obj.val2.push(headers[k].name);
			}
			var newObj = {row:obj.val1,headings:obj.val2};
			callback(newObj);

			  });
		}
		else{
			  connection.execute("SELECT * FROM DAGR WHERE 1 = 0",
			  function(err, result)
			  {
				if (err) { console.error(err); callback(); }
				resultSet = result.rows;
				headers = result.metaData;
				connection.close();
			for(i = 0; i < resultSet.length;i++){
				for(j = 0; j<resultSet[0].length;j++){
					obj.val1.push(resultSet[i][j]);
				}
			}
			for(k = 0; k < headers.length;k++){
				obj.val2.push(headers[k].name);
			}
			var newObj = {row:obj.val1,headings:obj.val2};
			callback(newObj);
			  });
		}
	  });
}



app.get('/', function(req, res){
	
	res.render(path.join(__dirname,'views/webInterface.ejs'));
	
});

app.post('/submit', function(req, res,next){
		//These are all the Query fields based off of names.
		//Most useful to Least is: GUID, File Name, Annotation, File Size, Timestamp
		
		
		console.log(req.body.GUID);
	/*	console.log(req.body.fileName);
		console.log(req.body.File_Size);
		console.log(req.body.timeStamp);
		console.log(req.body.Anno);*/
		var results = {
			val1:[],
			val2:[]
			
		};

		//incoming query results
		//console.log(workplz);
		//req.metaData = workplz.row;
		//req.titles = workplz.headings;
	//	console.log(req.metaData);
	//	console.log(req.titles);
	if(req.body.Range1!==""&&req.body.Range2!==""){
	wanted_result(req.body.Range1,req.body.Range2,results,function(workplz){
		
	
	req.works = workplz.row;
	req.titles = workplz.head;
	
	
	
		res.render(path.join(__dirname,'views/webInterface2.ejs'), { dagr_data: req.works, title: req.titles });
		});
	}
	else if(req.body.GUID!==""||req.body.fileName!==""
	||req.body.File_Size!==""||req.body.timeStamp!==""||req.body.Anno!==""){
		wanted_result2(req.body.GUID, req.body.fileName,
		req.body.File_Size,req.body.timeStamp, req.body.Anno,results,function(workplz2){
		
		res.render(path.join(__dirname,'views/webInterface2.ejs'), { dagr_data: workplz2.row
		, title: workplz2.head });
	});

	};
});
var wanted_result3 = function AllDagr(obj,callback){
	oracledb.getConnection(
	  {
		user          : "admin",
		password      : "admin",
		connectString : "localhost/XE"
	  },
	  function(err, connection)
	  {
		if (err) { console.error(err); callback(); }
		
		connection.execute("Select * From DAGR",
		  function(err, result)
		  {
			if (err) { console.error(err); callback(); }
			
			//gets something from the database is in list of lists format,
			//rows is key
			//req is the request from the get.
			resultSet = result.rows;
			headers = result.metaData;
			connection.close();
			for(i = 0; i < resultSet.length;i++){
				for(j = 0; j<resultSet[0].length;j++){
					obj.val1.push(resultSet[i][j]);
				}
			}
			

			for(k = 0; k < headers.length;k++){
				obj.val2.push(headers[k].name);
			}
			var newObj = new Object();
			newObj.row = obj.val1;
			newObj.head = obj.val2;
			callback(newObj);
		  });
		  
	  });
}
app.post('/submit1', function(req, res,next){
	var results = {
			val1:[],
			val2:[]
			
		};
	wanted_result3(results,function(workplz3){
		
		res.render(path.join(__dirname,'views/webInterface2.ejs'), { dagr_data: workplz3.row
		, title: workplz3.head });
		
	});

});

function editAnon(number,message){
	
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
		"Update DAGR SET DAGR.Annotation = :1 Where DAGR.GUID = :2", [message, number]
		  ,
		  {autoCommit: true},
		  function(err, result)
		  {
			if (err) { console.error(err); return; }
			connection.close();
		  });
	  });
	
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

function insertionDAGRDAGR(DAGR_GUID_1, DAGR_GUID_2){
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
		"INSERT INTO DAGR_DAGR (GUID_1, GUID_2) Values(:1, :2)", 
		[DAGR_GUID_1, DAGR_GUID_2],
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
			"SELECT DAGR_SIZE from DAGR WHERE GUID = :guid",[DAGR_GUID_1],
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
						[insert+1, DAGR_GUID_1],
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

function getDateTime() {

    var date = new Date();

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

//changes the annon
app.post('/submit2', function(req, res,next){
	

	var GUID = uuidv1();
	if(req.body.EditID!==""&&req.body.newCat!==""){
	insertionDAGR(GUID, getDateTime(),req.body.newCat );
	insertionDAGRDAGR(req.body.EditID,GUID);
	}
	if(req.body.EditID===""){
		insertionDAGR(GUID, getDateTime(),req.body.newCat );	
	}
	if(req.body.changeAnn!==""&&req.body.EditID!==""){
		editAnon(req.body.EditID,req.body.changeAnn);
			console.log('updated');

	}
});




var server = app.listen(3500, function(){
  console.log('Server listening on port 3500');
});
