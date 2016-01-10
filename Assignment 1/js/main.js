var canvas;
var gl;
var program;
var vertexbuffer;
var objModels = [];

/**
* Write the RGBA value of a given pixel location.
*/
function setPixel( imageData, x, y, r, g, b, a ) {
    index = ( x + y * imageData.width ) * 4;
    imageData.data[index+0] = r;
    imageData.data[index+1] = g;
    imageData.data[index+2] = b;
    imageData.data[index+3] = a;
}


/*
* Pixel manipulation example.
*/
function writeCanvasPixels() {
	var ctx = canvas.getContext('2d');
	var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height );
	
	// one-dimensional array of integers, where each element is in the range 0...255.
	// arranged in a repeating sequence so that each element refers to an individual RGB channel.
	// var data = imageData.data;

	// data[0]  = red channel of first pixel on first row
	// data[1]  = green channel of first pixel on first row
	// data[2]  = blue channel of first pixel on first row
	// data[3]  = alpha channel of first pixel on first row
	
	// clear all pixels to black
	for (i = 0; i < canvas.width; i++) {
		for( j = 0; j < canvas.height; j++ ) {
			setPixel(imageData, i, j, 0, 0, 0, 255);			
		}		
	}
	
	
	// update the canvas
	 ctx.putImageData( imageData, 0, 0 );
}


/**
* Program entry point.
*/
function startTracing() {	
	
	// get a WebGL context
	canvas = document.getElementById( "canvas-rt" );
	
	console.log(1);
	// document.getElementById('objInput').addEventListener('change', scene.loadObjectFile, false);
	// document.getElementById('mtlInput').addEventListener('change', scene.loadMtlFile, false);
	console.log(3);
	// 2D example
	
	readFile("models/args.txt");
	
}


function readFile(fileName)
{
    var newFile = new XMLHttpRequest();
    newFile.open("GET", fileName, false);
    newFile.onreadystatechange = function ()
    {
        if(newFile.readyState === 4)
        {
            if(newFile.status == 200 || newFile.status == 0)
            {
                var content = newFile.responseText;
                parseFile(content);
            }
        }
    }
    newFile.send(null);
}

function parseFile(content)
{
    var lines = content.split("\n");
	var groupIndex = -1;
	var curLine,data;
	var lights = [];
	for (var i = 0; i < lines.length; i++) {
		  curLine = lines[i].trim();
		  data = curLine.split(" ");

		  if(data[0] == "window")
		  {
		  	data.shift();
		  	canvas.width = data[0];
		  	canvas.height = data[1];
		  	 writeCanvasPixels();
		  }
		  if(data[0] == "scale")
		  {
		  	data.shift();
		  	scene.setScale(data[0]);
		  }
		  if(data[0] == "light")
		  {
		  	data.shift();
		  	lights.push.apply(lights,data);
		  }
		  else if (data[0] == "loadOBJ")
		  {
		  	data.shift();
		  	objModels.push.apply(objModels,data);
		  	
		  }


		}
		
			scene.setLightSources(lights);
			scene.loadObjectFiles(objModels);

		// console.log(" Models to load "+objModels);

}
