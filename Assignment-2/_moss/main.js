var canvas;
var gl;
var program;

var vertexbuffer;
var vertexColorBuffer;
var vertexNormalBuffer;
var vertexTextureBuffer;
var vertexTextureIndexBuffer;
var vertexScale;
var normalFlag = true;
var textureFlag = true;
var kaBuffer;
var kdBuffer;
var ksBuffer;
var nBuffer;
var texCount = -1;
var texLoadCount = -1;
var textures = [];
var texturesImages = [];
var texImages = [];
var lightData = [];
var lightCount = 0;

var lightPosition = [];
var ambientLight = [];
var diffuseLight = [];
var specularLight = [];
// var lineBuffer;
var groups;
var rotationAxis = [0,1,0];
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var lookAtMatrix =mat4.create();
var vertE = [0,0,-2];//Eye Location
var vertL = [0,2,4];// Light Vector



var xDir = 0, yDir = 0, zDir = 0, scale = 1, rotate = 0;


/**
* Pull the shader code from a script tag.
*/
 function getShader(gl, id) {
	var shaderScript = document.getElementById(id);
	if (!shaderScript) return null;

	var str = "";
	var k = shaderScript.firstChild;
	while (k) {
		if (k.nodeType == 3) {
			str += k.textContent;
		}
		k = k.nextSibling;
	}

	var shader;
	if (shaderScript.type == "x-shader/x-vertex") {
		shader = gl.createShader(gl.VERTEX_SHADER);
	}else if (shaderScript.type == "x-shader/x-fragment") {
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	}else {
		return null;
	}

	gl.shaderSource(shader, str);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
}


/**
* Load and compile GLSL shaders.
*/
function loadShaders() {
	var vertexShader = getShader(gl, "shader-vs");
	var fragmentShader = getShader(gl, "shader-fs");

	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		console.error( "Could not initialize shaders" );
	}

	gl.useProgram(shaderProgram);

	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
	shaderProgram.vertexTextureAttribute = gl.getAttribLocation(shaderProgram, "aTexCoordinate");
	shaderProgram.ambientLightAttribue = gl.getAttribLocation(shaderProgram, "aVertexKA");
	shaderProgram.specularLightAttribute = gl.getAttribLocation(shaderProgram, "aVertexKS");
	shaderProgram.diffuseLightAttribute = gl.getAttribLocation(shaderProgram, "aVertexKD");
	shaderProgram.nValAttribute = gl.getAttribLocation(shaderProgram, "aN");
	shaderProgram.vertexTextureIndex = gl.getAttribLocation(shaderProgram, "aTextureIndex");


    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
    gl.enableVertexAttribArray(shaderProgram.vertexTextureAttribute);
    gl.enableVertexAttribArray(shaderProgram.ambientLightAttribue);
    gl.enableVertexAttribArray(shaderProgram.specularLightAttribute);
    gl.enableVertexAttribArray(shaderProgram.diffuseLightAttribute);
    gl.enableVertexAttribArray(shaderProgram.nValAttribute);
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    gl.enableVertexAttribArray(shaderProgram.vertexTextureIndex);

	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.lAtMatrixUniform = gl.getUniformLocation(shaderProgram, "uLMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    shaderProgram.lVectorUniform = gl.getUniformLocation(shaderProgram, "aLightVector");
    shaderProgram.eVectorUniform = gl.getUniformLocation(shaderProgram, "aEyeVector");
    shaderProgram.lightPositionUniform = gl.getUniformLocation(shaderProgram, "aLightPositions");
    shaderProgram.ambientLightUniform = gl.getUniformLocation(shaderProgram, "aAmbientLights");
    shaderProgram.diffuseLightUniform = gl.getUniformLocation(shaderProgram, "aDiffuseLights");
    shaderProgram.specularLightUniform = gl.getUniformLocation(shaderProgram, "aSpecularLights");
    shaderProgram.samplerUniform1 = gl.getUniformLocation(shaderProgram, "uSampler1");
    shaderProgram.samplerUniform2 = gl.getUniformLocation(shaderProgram, "uSampler2");


}


function setMatrixUniforms() {
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
        gl.uniformMatrix4fv(shaderProgram.lAtMatrixUniform, false, lookAtMatrix);


        var normalMatrix = mat3.create();
        // mat4.toInverseMat3(mvMatrix, normalMatrix);
        mat3.normalFromMat4(normalMatrix,mvMatrix);
        gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
        gl.uniform3fv(shaderProgram.lVectorUniform, [0,5,9]);
        gl.uniform3fv(shaderProgram.eVectorUniform, [0,0,8]);
        gl.uniform3fv(shaderProgram.lightPositionUniform,lightPosition);
        gl.uniform3fv(shaderProgram.ambientLightUniform,ambientLight);
        gl.uniform3fv(shaderProgram.diffuseLightUniform,diffuseLight);
        gl.uniform3fv(shaderProgram.specularLightUniform,specularLight);
        
    }


/**
* Program initialization.
*/

function loadTextures() {

	for (var i = 0; i < texImages.length; i++) {
		
	
		  var groupTexture = gl.createTexture();
		  var texImage = new Image();
		  	 texImage.src = "models/"+texImages[i];
		  	 groupTexture.index = [i];
		  	gl.bindTexture(gl.TEXTURE_2D, groupTexture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
		              new Uint8Array([0, 0, 0, 0])); 
		  texImage.onload = function() { loadTextureImage(); }
		 
		  console.log("Src "+texImage.src);

		  textures.push(groupTexture);
		  texturesImages.push(texImage);
	};

}

// function isImageSizePowerOf2(image) {
// 	var imgWidth  = image.width;
// 	var imgHeight = image.height;
//   return ((imgWidth & (imgWidth - 1)) == 0) && ((imgHeight & (imgHeight - 1)) == 0);
// };

function loadTextureImage() {
  	texLoadCount++;
 	 gl.bindTexture(gl.TEXTURE_2D, textures[texLoadCount]);
   	 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // For Web GL Flip Y

   	 // if(isImageSizePowerOf2(texturesImages[texLoadCount]))
   	 // {
   	 // 	gl.generateMipmap(gl.TEXTURE_2D);
    	// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
   	 // }
   	 // else
   	 {
   	 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
     }

     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texturesImages[texLoadCount]);	

  // gl.generateMipmap(gl.TEXTURE_2D);
  // gl.bindTexture(gl.TEXTURE_2D, null);
  if(texLoadCount == texCount)
  	render();
  console.log("Loading Image"+ textures[texLoadCount].index +" .........."+texturesImages[texLoadCount].src);
}



function addTextureName(texName)
{
	if(texName =="")
		return;

	for (var i = 0; i < texImages.length; i++) {
		if(texImages[i] == texName)
			return;
	};

	texImages.push(texName);
	texCount++;
}
function init() {
	
	// create and compile our GLSL program from the shaders
	loadShaders();	
	
	
	var vertexColor = [];

	
	var vertices = new Array();
	var vertexNormals = new Array();
	var vertexTextures = new Array();
	var vertexTextureIndex = new Array();
	var kA = new Array();
	var kD = new Array();
	var kS = new Array();
	var N = new Array();

	for (var i = 0; i < groups.length; i++) {

		console.log("Group "+groups[i].groupName +"  mtl name  "+groups[i].mtlName);
		console.log("kA "+groups[i].Ka+ "  kS  "+groups[i].Ks+"   kD  "+groups[i].Kd);
		
		vertices.push.apply(vertices,groups[i].faces.v);
		if(groups[i].faces.vn.length != 0)
			{ 
				vertexNormals.push.apply(vertexNormals,groups[i].faces.vn);
				normalFlag = true;
			}
		else
			{
				normalFlag = false;

			}
		if(groups[i].faces.vt.length != 0)
			{
				vertexTextures.push.apply(vertexTextures,groups[i].faces.vt);
				textureFlag = true;
			}
			else
			{
				textureFlag = false;
				for (var j = 0; j < groups[i].faces.v.length/3; j++) {
					vertexTextures.push(0);
					vertexTextures.push(0);
				};

			}

		if(groups[i].texMap != "")
			addTextureName(groups[i].texMap);
		console.log("Texture Map :-> " + groups[i].texMap+ "  Tex COunt --> "+texCount);

		for (var j = 0; j < groups[i].faces.v.length; j+=3) {
			kA.push.apply(kA,groups[i].Ka);
			kD.push.apply(kD,groups[i].Kd);
			kS.push.apply(kS,groups[i].Ks);
			N.push(groups[i].N);
			vertexTextureIndex.push(parseFloat(texCount));

		};
	
	};

	// for (var i = 0; i < vertices.length; i++) {
	// 	vertices[i]  = vertices[i] / vertexScale;
	// };

	//Load texture Images
	loadTextures();
	// // gl.NEAREST is also allowed, instead of gl.LINEAR, as neither mipmap.
	// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	// // Prevents s-coordinate wrapping (repeating).
	// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	// // Prevents t-coordinate wrapping (repeating).
	// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	
	// // create a buffer and put a single clipspace triangle in it	

	vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	vertexBuffer.itemSize = 3;
	vertexBuffer.numItems = vertices.length/3;


	vertexTextureIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexTextureIndexBuffer);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexTextureIndex), gl.STATIC_DRAW);
	vertexTextureIndexBuffer.itemSize = 1;
	vertexTextureIndexBuffer.numItems = vertexTextureIndex.length;

	//create buffer for vertex kA values
	kaBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, kaBuffer);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(kA), gl.STATIC_DRAW);
	kaBuffer.itemSize = 3;
	kaBuffer.numItems = kA.length/3;

	// console.log("kaBuffer"+kA);
	//create buffer for vertex kD values
	kdBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, kdBuffer);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(kD), gl.STATIC_DRAW);
	kdBuffer.itemSize = 3;
	kdBuffer.numItems = kD.length/3;

	// console.log("kdBuffer"+kD);
	//create buffer for vertex kS values
	ksBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, ksBuffer);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(kS), gl.STATIC_DRAW);
	ksBuffer.itemSize = 3;
	ksBuffer.numItems = kS.length/3;

	// console.log("ksBuffer"+kS);
	//create buffer for vertex N values
	nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(N), gl.STATIC_DRAW);
	nBuffer.itemSize = 1;
	nBuffer.numItems = N.length;

	// console.log("N"+N);
	//create buffer for vertex normal values
	vertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
   
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
    vertexNormalBuffer.itemSize = 3;
    vertexNormalBuffer.numItems = vertexNormals.length/3;

    //create buffer for vertex texture values
	vertexTextureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexTextureBuffer);
   
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexTextures), gl.STATIC_DRAW);
    vertexTextureBuffer.itemSize = 2;
    vertexTextureBuffer.numItems = vertexTextures.length/2;

    console.log("vertexBuffer.numItems"+vertexBuffer.numItems);
    console.log("vertexNormalBuffer.numItems"+vertexNormalBuffer.numItems);
    console.log("vertexTextureBuffer.numItems"+vertexTextureBuffer.numItems);
    console.log("vertexTextureIndexBuffer.numItems"+vertexTextureIndexBuffer.numItems);
    console.log("kaBuffer.numItems"+kaBuffer.numItems);
    console.log("ksBuffer.numItems"+ksBuffer.numItems);
    console.log("kdBuffer.numItems"+kdBuffer.numItems);
    console.log("NBuffer.numItems"+nBuffer.numItems);


}


/**
* Main rendering function.
*/
function render() {
	
	// clear the canvas
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	console.log(pMatrix);
	mat4.perspective(pMatrix,45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
	console.log(pMatrix);
    mat4.identity(mvMatrix);

    mat4.lookAt(mvMatrix,[0,0,8],[0,0,0],[0,1,0]);
    // mat4.translate(mvMatrix, [-vertE[0], -vertE[1], -vertE[2]]);
    mat4.scale(mvMatrix,mvMatrix, [scale, scale, scale]);
    mat4.translate(mvMatrix,mvMatrix, [xDir, yDir, zDir]);
   
    mat4.rotate(mvMatrix,mvMatrix, rotate, [rotationAxis[0],rotationAxis[1],rotationAxis[2]]); 
    
    // transform values debug

    console.log("X dir "+xDir);
	console.log("Y dir "+yDir);
	console.log("Z dir "+zDir);
	console.log("scale "+scale);
	// console.log("P"+pMatrix);
	// console.log("MV"+mvMatrix);
	// console.log("P*M"+pMatrix * mvMatrix);
  

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexTextureBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexTextureAttribute, vertexTextureBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexTextureIndexBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexTextureIndex, vertexTextureIndexBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, vertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, kaBuffer);
    gl.vertexAttribPointer(shaderProgram.ambientLightAttribue, kaBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, kdBuffer);
    gl.vertexAttribPointer(shaderProgram.diffuseLightAttribute, kdBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, ksBuffer);
    gl.vertexAttribPointer(shaderProgram.specularLightAttribute, ksBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.vertexAttribPointer(shaderProgram.nValAttribute, nBuffer.itemSize, gl.FLOAT, false, 0, 0);

		// if(textures[0] != null)
		{
			gl.activeTexture(gl.TEXTURE0);
	  		gl.bindTexture(gl.TEXTURE_2D, textures[0]);
	  		gl.uniform1i(shaderProgram.samplerUniform1, 0);
  		}

  		// if(textures[1] != null)
		{
			gl.activeTexture(gl.TEXTURE1);
	  		gl.bindTexture(gl.TEXTURE_2D, textures[1]);
	  		gl.uniform1i(shaderProgram.samplerUniform2, 1);
  		}

  	setMatrixUniforms();
	// draw the triangle
	gl.drawArrays(gl.TRIANGLES, 0, vertexBuffer.numItems);
}



function handleKeyDown(event) {
    
    var keyCode = event.keyCode;
    console.log("Key Pressed "+event.keyCode);

	if (keyCode == 90) {

        scale *= 1.2;
    } else if (keyCode == 88) {

        scale *= 0.8;
    } else {
        scale *= 1;
    }


    if (keyCode == 81) {
        rotate += Math.PI/36;
    } else if (keyCode == 87) {
        rotate -= Math.PI/36;
    } else {
        rotate += 0;
    }


    if (keyCode == 219) {
        zDir += 0.5;
    } else if (keyCode == 221) {
        zDir -= 0.5;
    } else {
        zDir += 0;
    }

    if (keyCode == 39) {
        xDir += 0.5;
    } else if (keyCode == 37) {
        xDir -= 0.5;
    } else {
        xDir += 0;
    }

    if (keyCode == 38) {
        yDir += 0.5;
    } else if (keyCode == 40) {
        yDir -= 0.5;
    } else {
        yDir += 0;
    }
    if(keyCode == 65)
    {
    	rotationAxis = [1,0,0];
    }
    if(keyCode == 68)
    {
    	rotationAxis = [0,0,1];
    }
    if(keyCode == 83)
    {
    	rotationAxis = [0,1,0];
    }
    render();

}

function handleKeyUp(event) {
   // xDir = 0;
   // yDir = 0;
   // zDir = 0;
   // scale = 1;
   // render();
}

/**
* Program entry point.
*/
function main() {	
	
	// get a WebGL context
	canvas = document.getElementById( "canvas-rz" );
	
	// 3D example
	gl = canvas.getContext("experimental-webgl");
	
	gl.viewportWidth = canvas.width;
	gl.viewportHeight = canvas.height;
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	
	// set the GL clear color
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	
	readFile("window.txt");
	readFile("lights.txt");


	for (var i = 0; i < 5; i++) {
		
			if(i < lightCount)
			{
				lightPosition.push(lightData[i*12]);	lightPosition.push(lightData[i*12 + 1]);	lightPosition.push(lightData[i*12 + 2]);
				ambientLight.push(lightData[i*12 + 3]);	ambientLight.push(lightData[i*12 + 4]);		ambientLight.push(lightData[i*12 + 5]);
				diffuseLight.push(lightData[i*12 + 6]);	diffuseLight.push(lightData[i*12 + 7]);		diffuseLight.push(lightData[i*12 + 8]);
				specularLight.push(lightData[i*12 + 9]);	specularLight.push(lightData[i*12 + 10]);	specularLight.push(lightData[i*12 + 11]);
			}
			else
			{
				lightPosition.push(0);lightPosition.push(0);lightPosition.push(0);
				ambientLight.push(0);ambientLight.push(0);ambientLight.push(0);
				diffuseLight.push(0);diffuseLight.push(0);diffuseLight.push(0);
				specularLight.push(0);specularLight.push(0);specularLight.push(0);
			}

		}
		console.log("Light position "+lightPosition);
		console.log("Light ambient "+ambientLight);
		console.log("Light diffuse "+diffuseLight);
		console.log("Light specular "+specularLight);

	var queryString = window.location.search.substring(0);
	var queryData = queryString.split("=");
	var objModels = new Array();
	if(queryData[0] == "?objFilePath")
		objModels.push(queryData[1]);
	else
		{
			console.log("Please check query string format ?objFilePath=objFilename.obj");
			return;
		}
	groups = scene.loadObjectFiles(objModels);
	var center = scene.getObjectCenter();
	 scale =  1/scene.getScaleValue();
	 // vertexScale = scene.getScaleValue();
	  xDir = -center[0]; yDir = -center[1]; zDir = -center[2]; 
	


	// load shaders and bind arrays
	init();
	gl.enable(gl.DEPTH_TEST);
	
	// draw
	// render();
	// render();
	if(texturesImages.length == 0)
		render();

	//Handle Key events
	document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
	
	// 2D example
	// writeCanvasPixels();
}

function readFile(fileName)
{
    var newFile = new XMLHttpRequest();
    newFile.open("GET", fileName, false);
    newFile.onreadystatechange = function ()
    {
        if(newFile.readyState === 4)
        {
            if(newFile.status === 200 || newFile.status == 0)
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
	
	for (var i = 0; i < lines.length; i++) {
		  curLine = lines[i].trim();
		  data = curLine.split(" ");

		  if(data[0] == "window")
		  {
		  	data.shift();
		  	canvas.width = data[0];
		  	canvas.height = data[1];

		  }
		  else if(data[0] == "light")
		  {
		  	data.shift();
		  	lightData.push.apply(lightData,data);
		  	lightCount++;
		  }

		  // else if (data[0] == "loadOBJ")
		  // {
		  // 	data.shift();
		  // 	objModels.push.apply(objModels,data);
		  	
		  // }


		}
		
		
	  


		// console.log(" Models to load "+objModels);

}
window.onload = main;