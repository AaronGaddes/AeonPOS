// global variables
var db;
var shortName = 'WebPosDB';
var version = '1.0';
var displayName = 'WebPosDB';
var maxSize = 65535;


// var canvas = document.getElementById("myCanvas");
// var ctx = canvas.getContext("2d");

// this is called when an error happens in a transaction
function errorHandler(transaction, error) {
   alert('Error: ' + error.message + ' code: ' + error.code);

}

// this is called when a successful transaction happens
function successCallBack() {
   alert("DEBUGGING: success");

}

function nullHandler(){};

// called when the application loads
function onBodyLoad(){

// This alert is used to make sure the application is loaded correctly
// you can comment this out once you have the application working
alert("DEBUGGING: we are in the onBodyLoad() function");

 if (!window.openDatabase) {
   // not all mobile devices support databases  if it does not, thefollowing alert will display
   // indicating the device will not be albe to run this application
   alert('Databases are not supported in this browser.');
   return;
 }

// this line tries to open the database base locally on the device
// if it does not exist, it will create it and return a databaseobject stored in variable db
 db = openDatabase(shortName, version, displayName,maxSize);

// this line will try to create the table User in the database justcreated/openned
 db.transaction(function(tx){

  // you can uncomment this next line if you want the User table to beempty each time the application runs
 // tx.executeSql( 'DROP TABLE User',nullHandler,nullHandler);

   tx.executeSql( 'CREATE TABLE IF NOT EXISTS tables(tbl_id INTEGER NOT NULL PRIMARY KEY, tbl_name TEXT NOT NULL, tbl_posX INTEGER, tbl_posY INTEGER, tbl_maxQty INTEGER)',
   [],nullHandler,errorHandler);

   tx.executeSql( 'INSERT INTO tables(tbl_name, tbl_posX, tbl_posY, tbl_maxQty)SELECT 1,100,100,4 WHERE NOT EXISTS(SELECT 1 FROM tables WHERE tbl_name = 1)',
   [],nullHandler,errorHandler);

   tx.executeSql( 'INSERT INTO tables(tbl_name, tbl_posX, tbl_posY, tbl_maxQty)SELECT 2,200,200,4 WHERE NOT EXISTS(SELECT 1 FROM tables WHERE tbl_name = 2)',
   [],nullHandler,errorHandler);

   tx.executeSql( 'INSERT INTO tables(tbl_name, tbl_posX, tbl_posY, tbl_maxQty)SELECT 3,300,300,6 WHERE NOT EXISTS(SELECT 1 FROM tables WHERE tbl_name = 3)',
   [],nullHandler,errorHandler);

   tx.executeSql( 'INSERT INTO tables(tbl_name, tbl_posX, tbl_posY, tbl_maxQty)SELECT 4,400,1400,8 WHERE NOT EXISTS(SELECT 1 FROM tables WHERE tbl_name = 4)',
   [],nullHandler,errorHandler);

 },errorHandler,successCallBack);

}

// list the values in the database to the screen using jquery toupdate the #lbUsers element
function ListDBValues() {

 if (!window.openDatabase) {
  alert('Databases are not supported in this browser.');
  return;
 }
// this next section will select all the content from the User tableand then go through it row by row
// appending the UserId  FirstName  LastName to the  #lbUsers elementon the page
 db.transaction(function(transaction) {
   transaction.executeSql('SELECT * FROM tables;', [],
     function(transaction, result) {
       var tempArray = [];
      if (result != null && result.rows != null) {
        tempArray= result.rows;
      }
      return tempArray;
     },errorHandler);

 },errorHandler,nullHandler);

return tableArray;

}

// this is the function that puts values into the database using thevalues from the text boxes on the screen
function AddValueToDB() {

 if (!window.openDatabase) {
   alert('Databases are not supported in this browser.');
   return;
 }

// this is the section that actually inserts the values into the Usertable
 db.transaction(function(transaction) {
   transaction.executeSql('INSERT INTO User(FirstName, LastName, IOU)VALUES (?,?,?)',[$('#txFirstName').val(), $('#txLastName').val(), $('#txtIOU').val()],
     nullHandler,errorHandler);
   });

// this calls the function that will show what is in the User table inthe database
 ListDBValues();

 return false;

}

function RemoveValueFromDB(el) {

 if (!window.openDatabase) {
   alert('Databases are not supported in this browser.');
   return;
 }

// this is the section that actually inserts the values into the Usertable
 db.transaction(function(transaction) {
   transaction.executeSql('DELETE FROM User WHERE UserId = ?',[el],
     nullHandler,errorHandler);
   });

// this calls the function that will show what is in the User table inthe database
 ListDBValues();

 return false;

}

function UpdateValueInDB(el,val) {

 if (!window.openDatabase) {
   alert('Databases are not supported in this browser.');
   return;
 }

// this is the section that actually inserts the values into the Usertable
 db.transaction(function(transaction) {
   transaction.executeSql('UPDATE User SET IOU = IOU + ? WHERE UserId = ?',[val,el],
     nullHandler,errorHandler);
   });

// this calls the function that will show what is in the User table inthe database
 ListDBValues();

 return false;

}
