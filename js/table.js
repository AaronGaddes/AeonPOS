// By Simon Sarris
// www.simonsarris.com
// sarris@acm.org
//
// Code from the following pages merged by Andrew Clark (amclark7@gmail.com):
//   http://simonsarris.com/blog/510-making-html5-canvas-useful
//   http://simonsarris.com/blog/225-canvas-selecting-resizing-shape
// Last update June 2013
//
// Free to use and distribute at will
// So long as you are nice to people, etc

// Constructor for Shape objects to hold data for all drawn objects.
// For now they will just be defined as rectangles.
function Shape(state, x, y, w, h, name, maxQty, status,id) {
  "use strict";
  // This is a very simple and unsafe constructor. All we're doing is checking if the values exist.
  // "x || 0" just means "if there is a value for x, use that. Otherwise use 0."
  // But we aren't checking anything else! We could put "Lalala" for the value of x
  this.state = state;
  this.x = x || 0;
  this.y = y || 0;
  this.w = w || 1;
  this.h = h || 1;
  this.name = name || "x";
  this.status = status || 0;
  this.maxQty = maxQty || 4;
  this.id = id;
}

// Draws this shape to a given context
Shape.prototype.draw = function(ctx, optionalColor) {
  "use strict";
  var i, cur, half;
  var tStatus = this.status;
  var colour;
  switch (tStatus) {
    case 0:
      colour = 'rgba(0,205,0,0.7)';
      break;
    case 1:
      colour = 'rgba(0,0,205,0.7)';
      break;
    case 2:
      colour = 'rgba(205,205,0,0.7)';
      break;
    case 3:
      colour = 'rgba(205,0,0,0.7)';
      break;
    }
  ctx.fillStyle = colour;
  ctx.fillRect(this.x, this.y, this.w, this.h);

  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.font='18px Arial';
  ctx.fillText(this.name + ' (' + this.maxQty + ')', this.x+(this.w/2), this.y+(this.h/2));

  if (this.state.selection === this) {
    ctx.strokeStyle = this.state.selectionColor;
    ctx.lineWidth = this.state.selectionWidth;
    ctx.strokeRect(this.x,this.y,this.w,this.h);

    // draw the boxes
    half = this.state.selectionBoxSize / 2;

    // 0  1  2
    // 3     4
    // 5  6  7

    // top left, middle, right
    this.state.selectionHandles[0].x = this.x-half;
    this.state.selectionHandles[0].y = this.y-half;

    this.state.selectionHandles[1].x = this.x+this.w/2-half;
    this.state.selectionHandles[1].y = this.y-half;

    this.state.selectionHandles[2].x = this.x+this.w-half;
    this.state.selectionHandles[2].y = this.y-half;

    //middle left
    this.state.selectionHandles[3].x = this.x-half;
    this.state.selectionHandles[3].y = this.y+this.h/2-half;

    //middle right
    this.state.selectionHandles[4].x = this.x+this.w-half;
    this.state.selectionHandles[4].y = this.y+this.h/2-half;

    //bottom left, middle, right
    this.state.selectionHandles[6].x = this.x+this.w/2-half;
    this.state.selectionHandles[6].y = this.y+this.h-half;

    this.state.selectionHandles[5].x = this.x-half;
    this.state.selectionHandles[5].y = this.y+this.h-half;

    this.state.selectionHandles[7].x = this.x+this.w-half;
    this.state.selectionHandles[7].y = this.y+this.h-half;


    ctx.fillStyle = this.state.selectionBoxColor;
    for (i = 0; i < 8; i += 1) {
      cur = this.state.selectionHandles[i];
      ctx.fillRect(cur.x, cur.y, this.state.selectionBoxSize, this.state.selectionBoxSize);
    }
  }
};

// Determine if a point is inside the shape's bounds
Shape.prototype.contains = function(mx, my) {
  "use strict";
  // All we have to do is make sure the Mouse X,Y fall in the area between
  // the shape's X and (X + Height) and its Y and (Y + Height)
  return  (this.x <= mx) && (this.x + this.w >= mx) &&
          (this.y <= my) && (this.y + this.h >= my);
};

function CanvasState(canvas,editable) {
  "use strict";
  // **** First some setup! ****

  this.canvas = canvas;
  this.width = canvas.width;
  this.height = canvas.height;
  this.ctx = canvas.getContext('2d');
  this.editable = editable;
  // This complicates things a little but but fixes mouse co-ordinate problems
  // when there's a border or padding. See getMouse for more detail
  var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop,
      html, myState, i;
  if (document.defaultView && document.defaultView.getComputedStyle) {
    this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null).paddingLeft, 10)      || 0;
    this.stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null).paddingTop, 10)       || 0;
    this.styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null).borderLeftWidth, 10)  || 0;
    this.styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null).borderTopWidth, 10)   || 0;
  }
  // Some pages have fixed-position bars (like the stumbleupon bar) at the top or left of the page
  // They will mess up mouse coordinates and this fixes that
  html = document.body.parentNode;
  this.htmlTop = html.offsetTop;
  this.htmlLeft = html.offsetLeft;

  // **** Keep track of state! ****

  this.valid = false; // when set to false, the canvas will redraw everything
  this.shapes = [];  // the collection of things to be drawn
  this.dragging = false; // Keep track of when we are dragging
  this.resizeDragging = false; // Keep track of resize
  this.expectResize = -1; // save the # of the selection handle
  // the current selected object. In the future we could turn this into an array for multiple selection
  this.selection = null;
  this.dragoffx = 0; // See mousedown and mousemove events for explanation
  this.dragoffy = 0;

  // New, holds the 8 tiny boxes that will be our selection handles
  // the selection handles will be in this order:
  // 0  1  2
  // 3     4
  // 5  6  7
  this.selectionHandles = [];
  for (i = 0; i < 8; i += 1) {
    this.selectionHandles.push(new Shape(this));
  }

  // **** Then events! ****

  // This is an example of a closure!
  // Right here "this" means the CanvasState. But we are making events on the Canvas itself,
  // and when the events are fired on the canvas the variable "this" is going to mean the canvas!
  // Since we still want to use this particular CanvasState in the events we have to save a reference to it.
  // This is our reference!
  myState = this;
if (myState.editable) {
  //fixes a problem where double clicking causes text to get selected on the canvas
  canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);
  // Up, down, and move are for dragging
  canvas.addEventListener('mousedown', function(e) {
    var mouse, mx, my, shapes, l, i, mySel;
    if (myState.expectResize !== -1) {
      myState.resizeDragging = true;
      return;
    }
    mouse = myState.getMouse(e);
    mx = mouse.x;
    my = mouse.y;
    shapes = myState.shapes;
    l = shapes.length;
    for (i = l-1; i >= 0; i -= 1) {
      if (shapes[i].contains(mx, my)) {
        mySel = shapes[i];
        // Keep track of where in the object we clicked
        // so we can move it smoothly (see mousemove)
        myState.dragoffx = mx - mySel.x;
        myState.dragoffy = my - mySel.y;
        myState.dragging = true;
        myState.selection = mySel;
        myState.valid = false;
        return;
      }
    }
    // havent returned means we have failed to select anything.
    // If there was an object selected, we deselect it
    if (myState.selection) {
      myState.selection = null;
      myState.valid = false; // Need to clear the old selection border
    }
  }, true);
  canvas.addEventListener('mousemove', function(e) {
    var mouse = myState.getMouse(e),
        mx = mouse.x,
        my = mouse.y,
        oldx, oldy, i, cur;
    if (myState.dragging){
      mouse = myState.getMouse(e);
      // We don't want to drag the object by its top-left corner, we want to drag it
      // from where we clicked. Thats why we saved the offset and use it here
      myState.selection.x = mouse.x - myState.dragoffx;
      myState.selection.y = mouse.y - myState.dragoffy;
      myState.valid = false; // Something's dragging so we must redraw
    } else if (myState.resizeDragging) {
      // time ro resize!
      oldx = myState.selection.x;
      oldy = myState.selection.y;

      // 0  1  2
      // 3     4
      // 5  6  7
      switch (myState.expectResize) {
        case 0:
          myState.selection.x = mx;
          myState.selection.y = my;
          myState.selection.w += oldx - mx;
          myState.selection.h += oldy - my;
          break;
        case 1:
          myState.selection.y = my;
          myState.selection.h += oldy - my;
          break;
        case 2:
          myState.selection.y = my;
          myState.selection.w = mx - oldx;
          myState.selection.h += oldy - my;
          break;
        case 3:
          myState.selection.x = mx;
          myState.selection.w += oldx - mx;
          break;
        case 4:
          myState.selection.w = mx - oldx;
          break;
        case 5:
          myState.selection.x = mx;
          myState.selection.w += oldx - mx;
          myState.selection.h = my - oldy;
          break;
        case 6:
          myState.selection.h = my - oldy;
          break;
        case 7:
          myState.selection.w = mx - oldx;
          myState.selection.h = my - oldy;
          break;
      }

      myState.valid = false; // Something's dragging so we must redraw
    }

    // if there's a selection see if we grabbed one of the selection handles
    if (myState.selection !== null && !myState.resizeDragging) {
      for (i = 0; i < 8; i += 1) {
        // 0  1  2
        // 3     4
        // 5  6  7

        cur = myState.selectionHandles[i];

        // we dont need to use the ghost context because
        // selection handles will always be rectangles
        if (mx >= cur.x && mx <= cur.x + myState.selectionBoxSize &&
            my >= cur.y && my <= cur.y + myState.selectionBoxSize) {
          // we found one!
          myState.expectResize = i;
          myState.valid = false;

          switch (i) {
            case 0:
              this.style.cursor='nw-resize';
              break;
            case 1:
              this.style.cursor='n-resize';
              break;
            case 2:
              this.style.cursor='ne-resize';
              break;
            case 3:
              this.style.cursor='w-resize';
              break;
            case 4:
              this.style.cursor='e-resize';
              break;
            case 5:
              this.style.cursor='sw-resize';
              break;
            case 6:
              this.style.cursor='s-resize';
              break;
            case 7:
              this.style.cursor='se-resize';
              break;
          }
          return;
        }

      }
      // not over a selection box, return to normal
      myState.resizeDragging = false;
      myState.expectResize = -1;
      this.style.cursor = 'auto';
    }
  }, true);
  canvas.addEventListener('mouseup', function(e) {
    myState.dragging = false;
    myState.resizeDragging = false;
    myState.expectResize = -1;
    if (myState.selection !== null) {
      if (myState.selection.w < 0) {
          myState.selection.w = -myState.selection.w;
          myState.selection.x -= myState.selection.w;
          newX = myState.selection.x;
      }
      if (myState.selection.h < 0) {
          myState.selection.h = -myState.selection.h;
          myState.selection.y -= myState.selection.h;
          newY = myState.selection.y;
      }
      var db = new Database();

      db.initDatabase();
      console.log('x = ' + myState.selection.x + ' y = ' + myState.selection.y + ' id = ' + myState.selection.id);
      db.updateTable(myState.selection.x,myState.selection.y,myState.selection.w,myState.selection.h,myState.selection.maxQty,myState.selection.status,myState.selection.id);

      $('#tbl-name').val(myState.selection.name);
      $('#tbl-maxQty').val(myState.selection.maxQty);

      $('#tbl-height').val(myState.selection.h);

      $('#tbl-width').val(myState.selection.w);

    }
  }, true);

} else {
  //fixes a problem where double clicking causes text to get selected on the canvas
  canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);
  // Up, down, and move are for dragging
  canvas.addEventListener('mousedown', function(e) {
    var mouse, mx, my, shapes, l, i, mySel;
    if (myState.expectResize !== -1) {
      myState.resizeDragging = true;
      return;
    }
    mouse = myState.getMouse(e);
    mx = mouse.x;
    my = mouse.y;
    shapes = myState.shapes;
    l = shapes.length;
    for (i = l-1; i >= 0; i -= 1) {
      if (shapes[i].contains(mx, my)) {
        mySel = shapes[i];
        // Keep track of where in the object we clicked
        // so we can move it smoothly (see mousemove)
        myState.dragoffx = mx - mySel.x;
        myState.dragoffy = my - mySel.y;
        myState.dragging = true;
        myState.selection = mySel;
        myState.valid = false;
        return;
      }
    }
    // havent returned means we have failed to select anything.
    // If there was an object selected, we deselect it
    if (myState.selection) {
      myState.selection = null;
      myState.valid = false; // Need to clear the old selection border
    }
  }, true);

  canvas.addEventListener('mouseup', function(e) {
    myState.dragging = false;
    myState.resizeDragging = false;
    myState.expectResize = -1;
    if (myState.selection !== null) {
    console.log('selected: ' + myState.selection.name + ' | status: ' + myState.selection.status);
    if(myState.selection.status == 3) {
      myState.selection.status = 0;
    } else {
      myState.selection.status +=1;
    }
    console.log(myState.selection.status);
    console.log(myState.shapes);
    var db = new Database();

    db.initDatabase();
    console.log('x = ' + myState.selection.x + ' y = ' + myState.selection.y + ' id = ' + myState.selection.id);
    db.updateTable(myState.selection.x,myState.selection.y,myState.selection.w,myState.selection.h,myState.selection.maxQty,myState.selection.status,myState.selection.id);

  }
  if (myState.selection) {
    myState.selection = null;
    myState.valid = false; // Need to clear the old selection border
  }

  }, true);

  // //double click for making new shapes
  // canvas.addEventListener('mouseup', function(e) {
  //   myState.dragging = false;
  //   myState.resizeDragging = false;
  //   myState.expectResize = -1;
  //   // var mouse, mx, my, shapes, l, i, mySel;
  //   //
  //   // mouse = myState.getMouse(e);
  //   // mx = mouse.x;
  //   // my = mouse.y;
  //   // shapes = myState.shapes;
  //   // l = shapes.length;
  //   // for (i = l-1; i >= 0; i -= 1) {
  //   //   if (shapes[i].contains(mx, my)) {
  //   //     mySel = shapes[i];
  //   //     myState.selection = mySel;
  //   //     console.log(mySel);
  //   //     // Link to open the dialog
  //   //
  //   //     var tStatusId = mySel.status;
  //   //     var tStatus = 0;
  //   //     var colour;
  //   //     switch (tStatusId) {
  //   //       case 0:
  //   //         tStatus = 'Available';
  //   //         colour = 'rgba(0,205,0,0.7)';
  //   //         break;
  //   //       case 1:
  //   //         tStatus = 'Ocupied';
  //   //         colour = 'rgba(0,0,205,0.7)';
  //   //         break;
  //   //       case 2:
  //   //         tStatus = 'Requires Cleaning';
  //   //         colour = 'rgba(205,205,0,0.7)';
  //   //         break;
  //   //       case 3:
  //   //         tStatus = 'Reserved';
  //   //         colour = 'rgba(205,0,0,0.7)';
  //   //         break;
  //   //       }
  //   //
  //   //       $(".tbl-status").removeClass('active');
  //   //       $(".tbl-status[data-status='"+tStatusId+"']").addClass('active');
  //   //     $("#dlg-tbl_status").html(tStatus);
  //   //     $(".ui-dialog-titlebar").css("background",colour);
  //   //
  //   //     $( "#dialog" ).dialog({
  //   //       autoOpen: false,
  //   //       title: "Table: "+ myState.selection.name + " ("+ tStatus +")",
  //   //       width: 500,
  //   //       buttons: [
  //   //         {
  //   //           text: "Ok",
  //   //           click: function() {
  //   //             var newStatus = 0;
  //   //             newStatus = $(".tbl-status.active").attr("data-status");
  //   //             myState.selection.status = newStatus;
  //   //             mySel.status = newStatus;
  //   //             var db = new Database();
  //   //
  //   //             db.initDatabase();
  //   //             console.log('status = ' + myState.selection.status + ' id = ' + myState.selection.id);
  //   //             db.updateTable(myState.selection.x,myState.selection.y,myState.selection.w,myState.selection.h,myState.selection.maxQty,myState.selection.status,myState.selection.id);
  //   //
  //   //             $( this ).dialog( "close" );
  //   //             //myState.valid = false;
  //   //             return;
  //   //           }
  //   //         },
  //   //         {
  //   //           text: "Cancel",
  //   //           click: function() {
  //   //             $( this ).dialog( "close" );
  //   //           }
  //   //         }
  //   //       ]
  //   //     });
  //   //
  //   //       $( "#dialog" ).dialog( "open" );
  //   //
  //   //       $(".tbl-status").click(function(){
  //   //         $(".tbl-status").removeClass('active');
  //   //         $(this).addClass('active');
  //   //       });
  //   //     return;
  //   //   }
  //   // }
  //   // // havent returned means we have failed to select anything.
  //   // // If there was an object selected, we deselect it
  //
  //     if (myState.selection !== null) {
  //           var tStatusId = myState.selection.status;
  //           var tStatus = 0;
  //           var colour;
  //           switch (tStatusId) {
  //             case 0:
  //               tStatus = 'Available';
  //               colour = 'rgba(0,205,0,0.7)';
  //               break;
  //             case 1:
  //               tStatus = 'Ocupied';
  //               colour = 'rgba(0,0,205,0.7)';
  //               break;
  //             case 2:
  //               tStatus = 'Requires Cleaning';
  //               colour = 'rgba(205,205,0,0.7)';
  //               break;
  //             case 3:
  //               tStatus = 'Reserved';
  //               colour = 'rgba(205,0,0,0.7)';
  //               break;
  //             }
  //
  //             $(".tbl-status").removeClass('active');
  //             $(".tbl-status[data-status='"+tStatusId+"']").addClass('active');
  //           $("#dlg-tbl_status").html(tStatus);
  //           $(".ui-dialog-titlebar").css("background",colour);
  //
  //           $( "#dialog" ).dialog({
  //             autoOpen: false,
  //             title: "Table: "+ myState.selection.name + " ("+ tStatus +")",
  //             width: 500,
  //             buttons: [
  //               {
  //                 text: "Ok",
  //                 click: function() {
  //                   var newStatus = 0;
  //                   newStatus = $(".tbl-status.active").attr("data-status");
  //                   myState.selection.status = newStatus;
  //
  //                   var db = new Database();
  //
  //                   db.initDatabase();
  //                   console.log('status = ' + myState.selection.status + ' id = ' + myState.selection.id);
  //                   db.updateTable(myState.selection.x,myState.selection.y,myState.selection.w,myState.selection.h,myState.selection.maxQty,myState.selection.status,myState.selection.id);
  //
  //                   $( this ).dialog( "close" );
  //                   //myState.valid = false;
  //                   return;
  //                 }
  //               },
  //               {
  //                 text: "Cancel",
  //                 click: function() {
  //                   $( this ).dialog( "close" );
  //                 }
  //               }
  //             ]
  //           });
  //
  //             $( "#dialog" ).dialog( "open" );
  //
  //             $(".tbl-status").click(function(){
  //               $(".tbl-status").removeClass('active');
  //               $(this).addClass('active');
  //             });
  //           return;
  //
  //     // var db = new Database();
  //     //
  //     // db.initDatabase();
  //     // console.log('x = ' + myState.selection.x + ' y = ' + myState.selection.y + ' id = ' + myState.selection.id);
  //     // db.updateTable(myState.selection.x,myState.selection.y,myState.selection.w,myState.selection.h,myState.selection.maxQty,myState.selection.status,myState.selection.id);
  //
  //   }
  //   if (myState.selection) {
  //     myState.selection = null;
  //     myState.valid = false; // Need to clear the old selection border
  //   }
  //
  // }, true);
}




  // **** Options! ****

  this.selectionColor = '#CC0000';
  this.selectionWidth = 2;
  this.selectionBoxSize = 6;
  this.selectionBoxColor = 'darkred';
  this.interval = 30;
  setInterval(function() { myState.draw(); }, myState.interval);
}

CanvasState.prototype.addShape = function(shape) {
  "use strict";
  this.shapes.push(shape);
  this.valid = false;
};

CanvasState.prototype.updateShape = function(tableNumber,maxQty,height,width,db) {
  "use strict";
  if (this.selection !== null) {
    this.selection.name = tableNumber;
    this.selection.maxQty = maxQty;
    this.selection.h = height;
    this.selection.w = width;
    //var db = new Database();

    //db.initDatabase();
    console.log('x = ' + this.selection.x + ' y = ' + this.selection.y + ' id = ' + this.selection.id);
    db.updateTable(this.selection.x,this.selection.y,this.selection.w,this.selection.h,this.selection.maxQty,this.selection.status,this.selection.id);
  }
  this.valid = false;
};

CanvasState.prototype.clear = function() {
  "use strict";
  this.ctx.clearRect(0, 0, this.width, this.height);
};

// While draw is called as often as the INTERVAL variable demands,
// It only ever does something if the canvas gets invalidated by our code
CanvasState.prototype.draw = function() {
  "use strict";
  var ctx, shapes, l, i, shape, mySel;
  // if our state is invalid, redraw and validate!
  if (!this.valid) {
    ctx = this.ctx;
    shapes = this.shapes;
    this.clear();

    // ** Add stuff you want drawn in the background all the time here **
console.log("drawing...");
console.log(shapes);
    // draw all shapes
    l = shapes.length;
    for (i = 0; i < l; i += 1) {
      shape = shapes[i];
      // We can skip the drawing of elements that have moved off the screen:
      if (shape.x <= this.width && shape.y <= this.height &&
          shape.x + shape.w >= 0 && shape.y + shape.h >= 0) {
        shapes[i].draw(ctx);
      }
    }

    // draw selection
    // right now this is just a stroke along the edge of the selected Shape
    if (this.selection !== null) {
      ctx.strokeStyle = this.selectionColor;
      ctx.lineWidth = this.selectionWidth;
      mySel = this.selection;
      ctx.strokeRect(mySel.x,mySel.y,mySel.w,mySel.h);
    }

    // ** Add stuff you want drawn on top all the time here **

    this.valid = true;
  }
};


// Creates an object with x and y defined, set to the mouse position relative to the state's canvas
// If you wanna be super-correct this can be tricky, we have to worry about padding and borders
CanvasState.prototype.getMouse = function(e) {
  "use strict";
  var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;

  // Compute the total offset
  if (element.offsetParent !== undefined) {
    do {
      offsetX += element.offsetLeft;
      offsetY += element.offsetTop;
      element = element.offsetParent;
    } while (element);
  }

  // Add padding and border style widths to offset
  // Also add the <html> offsets in case there's a position:fixed bar
  offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
  offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

  mx = e.pageX - offsetX;
  my = e.pageY - offsetY;

  // We return a simple javascript object (a hash) with x and y defined
  return {x: mx, y: my};
};

// If you dont want to use <body onLoad='init()'>
// You could uncomment this init() reference and place the script reference inside the body tag
//init();

function init() {

}
