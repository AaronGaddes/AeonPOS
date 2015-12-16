function Database(shortName,version,displayName,maxSize){
  this.db;
  this.shortName = shortName || 'WebPosDB';
  this.version = version || '1.0';
  this.displayName = displayName || 'WebPosDB';
  this.maxSize = maxSize || 65535;
}

// this is called when an error happens in a transaction
Database.prototype.errorHandler = function(transaction, error) {
   alert('Error: ' + error.message + ' code: ' + error.code);
};

// this is called when a successful transaction happens
Database.prototype.successCallBack = function() {
   //alert("DEBUGGING: success");
};

Database.prototype.nullHandler = function() {
  //
};

Database.prototype.initDatabase = function() {
  if (!window.openDatabase) {
    // not all mobile devices support databases  if it does not, thefollowing alert will display
    // indicating the device will not be albe to run this application
    alert('Databases are not supported in this browser.');
    return;
  };

  this.db = openDatabase(this.shortName, this.version, this.displayName,this.maxSize);

  // this line will try to create the table User in the database justcreated/openned
   this.db.transaction(function(tx){

    // you can uncomment this next line if you want the User table to beempty each time the application runs
   // tx.executeSql( 'DROP TABLE User',nullHandler,nullHandler);

     tx.executeSql( 'CREATE TABLE IF NOT EXISTS tables(tbl_id INTEGER NOT NULL PRIMARY KEY, tbl_name TEXT NOT NULL, tbl_posX INTEGER, tbl_posY INTEGER, tbl_width NUMBER, tbl_height NUMBER, tbl_maxQty INTEGER, tbl_status INTEGER)',
     [],this.nullHandler,this.errorHandler);

   },this.errorHandler,this.successCallBack);
};

Database.prototype.addTable = function(name,posX,posY,width,height,maxQty,status) {
  if (!window.openDatabase) {
   alert('Databases are not supported in this browser.');
   return;
 };
  this.db.transaction(function(tx){
    tx.executeSql( 'INSERT INTO tables(tbl_name, tbl_posX, tbl_posY, tbl_width, tbl_height, tbl_maxQty, tbl_status)SELECT ?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM tables WHERE tbl_name = ?)',
    [name,posX,posY,width,height,maxQty,status,name],this.nullHandler,this.errorHandler);
  },this.errorHandler,this.successCallBack);
};

Database.prototype.updateTable = function(posX,posY,width,height,maxQty,status,id) {
  if (!window.openDatabase) {
    alert('Databases are not supported in this browser.');
    return;
  }

 // this is the section that actually inserts the values into the Usertable
  this.db.transaction(function(transaction) {
    transaction.executeSql('UPDATE tables SET tbl_posX = ?, tbl_posY = ?,tbl_width = ?, tbl_height = ?, tbl_maxQty = ?, tbl_status = ? WHERE tbl_id = ?',[posX,posY,width,height,maxQty,status,id],
      this.nullHandler,this.errorHandler);
    });
};

Database.prototype.DropTables = function() {
  if (!window.openDatabase) {
    alert('Databases are not supported in this browser.');
    return;
  }

  this.db.transaction(function(transaction) {
    transaction.executeSql('DROP TABLE tables',[],
      this.nullHandler,this.errorHandler);
    });
};

Database.prototype.drawAllTables = function(canvasState) {

   if (!window.openDatabase) {
    alert('Databases are not supported in this browser.');
    return;
   }
  // this next section will select all the content from the User tableand then go through it row by row
  // appending the UserId  FirstName  LastName to the  #lbUsers elementon the page
   this.db.transaction(function(transaction) {
     transaction.executeSql('SELECT * FROM tables;', [],
       function(transaction, result) {
        if (result != null && result.rows != null) {
          var len = result.rows.length, i;
          for (i = 0; i < len; i++) {
            console.log(result.rows[i]);

            canvasState.addShape(new Shape(canvasState, result.rows[i].tbl_posX, result.rows[i].tbl_posY, result.rows[i].tbl_width, result.rows[i].tbl_height, result.rows[i].tbl_name,result.rows[i].tbl_maxQty,result.rows[i].tbl_status,result.rows[i].tbl_id));
          }
        }
      },this.errorHandler);

   },this.errorHandler,this.nullHandler);

};
