var canvas;
var gl;
var program;
var fontTexture;
var vertexbuffer;
var vertexColorBuffer;
var vertexNormalBuffer;
var vertexTextureBuffer;
var wireframeBuffer;
var vertexScale;
var normalFlag = true;
var textureFlag = true;
var kaBuffer;
var kdBuffer;
var ksBuffer;
var nBuffer;
var texCount = -1;
var texLoadCount = -1;
var selectedObject = 0;
var textures = [];
var texturesImages = [];
var texImages = [];
var texture;
var texturesImage;
var texName;
var lightData = [];
var lightCount = 0;

var lightPosition = [];
var ambientLight = [];
var diffuseLight = [];
var specularLight = [];
var initialIndex = 0;
// var lineBuffer;
var groups;
var objects = [];
var rotationAxis = [0,1,0];
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var lookAtMatrix = mat4.create();
var transformMatrix = mat4.create();
var vertE = vec3.create();//Eye Location
var vertL = vec3.create();// Light Vector
var vecLookAt = vec3.create();

var showBoundingBox = false;
var shiftPressed = false;
var xDir = 0, yDir = 0, zDir = 0, scale = 1, rotateY = 0, rotateX = 0;

var textVertices = [] ;
var textTextures = [] ;
var fontSize = 0.08;
var textBuffer;
var textTextureBuffer;

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
	// console.log("shaderProgram.vertexPositionAttribute"+shaderProgram.vertexPositionAttribute);
	shaderProgram.boxVertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aBoxVertexPosition");
	// console.log("shaderProgram.boxVertexPositionAttribute"+shaderProgram.boxVertexPositionAttribute);
	shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
	shaderProgram.vertexTextureAttribute = gl.getAttribLocation(shaderProgram, "aTexCoordinate");
	shaderProgram.ambientLightAttribue = gl.getAttribLocation(shaderProgram, "aVertexKA");
	shaderProgram.specularLightAttribute = gl.getAttribLocation(shaderProgram, "aVertexKS");
	shaderProgram.diffuseLightAttribute = gl.getAttribLocation(shaderProgram, "aVertexKD");
	shaderProgram.nValAttribute = gl.getAttribLocation(shaderProgram, "aN");
	shaderProgram.textVertexAttribute = gl.getAttribLocation(shaderProgram,"aTextVertex");
	shaderProgram.textTextureAttribute = gl.getAttribLocation(shaderProgram,"aTextTexture");
	// shaderProgram.vertexTextureIndex = gl.getAttribLocation(shaderProgram, "aTextureIndex");


   
    // gl.enableVertexAttribArray(shaderProgram.vertexTextureIndex);

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
    shaderProgram.isBoundingBox = gl.getUniformLocation(shaderProgram, "isBoundingBox");
    shaderProgram.isText = gl.getUniformLocation(shaderProgram,"isText");


}


function setMatrixUniforms() {
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
        gl.uniformMatrix4fv(shaderProgram.lAtMatrixUniform, false, lookAtMatrix);


        var normalMatrix = mat3.create();
        // mat4.toInverseMat3(mvMatrix, normalMatrix);
        mat3.normalFromMat4(normalMatrix,mvMatrix);
        gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
        gl.uniform3fv(shaderProgram.lVectorUniform, vertE);
        gl.uniform3fv(shaderProgram.eVectorUniform, vertL);
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
		
		// if(texImages[i]=="")
		// 	continue;
		  var groupTexture = gl.createTexture();
		  var texImage = new Image();
		  	 texImage.src = "models/"+texImages[i];
		  	 groupTexture.index = [i];
		  	gl.bindTexture(gl.TEXTURE_2D, groupTexture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
		              new Uint8Array([0, 0, 0, 0])); 
		  texImage.onload = function() { loadTextureImage(i); }
		 
		  // console.log("Src "+texImage.src);

		  textures[i]= (groupTexture);
		  texturesImages[i] = (texImage);
	};

}

var fontImage;
function loadFontTexture() {

	
		   fontTexture = gl.createTexture();
			 fontImage = new Image();
		  	 fontImage.src = "models/text_font.bmp";
		  	gl.bindTexture(gl.TEXTURE_2D, fontTexture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
		              new Uint8Array([0, 0, 0, 0])); 
		  fontImage.onload = function() { loadFontImage(); }




}


function loadFontImage() {
  	
  	
 	 gl.bindTexture(gl.TEXTURE_2D, fontTexture);
   	 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // For Web GL Flip Y

   	 
   	 {
   	 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
     }

     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fontImage);	

    
}


function loadTextureImage(index) {
  	texLoadCount++;
  	
  	// while(texImages[texLoadCount]=="")
  		// texLoadCount++;
 	 gl.bindTexture(gl.TEXTURE_2D, textures[texLoadCount]);
   	 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // For Web GL Flip Y

   	 gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texturesImages[texLoadCount]);	
   	 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
 	 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
 	 gl.generateMipmap(gl.TEXTURE_2D);
 	 gl.bindTexture(gl.TEXTURE_2D, null);
     console.log("Check texture -->"+index+" -->"+texturesImages[texLoadCount].src);
     

 
   if(texLoadCount == texCount)
  		startRendering();
  
}



function addTextureName(texName)
{
	if(texName =="")
		return;

	// for (var i = 0; i < texImages.length; i++) {
	// 	if(texImages[i] == texName)
	// 		return;
	// };

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
	// var vertexTextureIndex = new Array();
	var kA = new Array();
	var kD = new Array();
	var kS = new Array();
	var N = new Array();
	texCount = -1;

	for (var o = 0; o < objects.length; o++) {


		
			groups = objects[o].groups;
		

	for (var i = 0; objects[o].containsObj && i < groups.length ; i++) {
		// vertices = []; vertexTextures = []; vertexNormals = []; kA = []; kD = []; kS = []; //vertexTextureIndex =[];
		// console.log("Group "+groups[i].groupName +"  mtl name  "+groups[i].mtlName);
		// console.log("kA "+groups[i].Ka+ "  kS  "+groups[i].Ks+"   kD  "+groups[i].Kd);
		
		// for (var l = 0; l < groups[i].faces.v.length; l+=3) {
		// 	vertices.push((groups[i].faces.v[l]+objects[o].center[0])*objects[o].scale)
		// 	vertices.push((groups[i].faces.v[l + 1]+objects[o].center[1])*objects[o].scale)
		// 	vertices.push((groups[i].faces.v[l + 2]+objects[o].center[2])*objects[o].scale)
		// };
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

		// if(groups[i].texMap != "")
			 addTextureName(groups[i].texMap);
		// console.log("Texture Map :-> " + groups[i].texMap+ "  Tex COunt --> "+texCount);

		for (var j = 0; j < groups[i].faces.v.length; j+=3) {
			kA.push.apply(kA,groups[i].Ka);
			kD.push.apply(kD,groups[i].Kd);
			kS.push.apply(kS,groups[i].Ks);
			N.push(groups[i].N);
			// vertexTextureIndex.push((texCount));

		};
	
	
    };
};
	

	loadTextures();
	loadFontTexture();
	// console.log("Images "+texImages);
	

	vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	vertexBuffer.itemSize = 3;
	vertexBuffer.numItems = vertices.length/3;

	wireframeBuffer = gl.createBuffer();

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
	// if(groups[i].texMap == "")
 //    	render();
    // initialIndex = vertexBuffer.numItems;

    // console.log("vertexBuffer.numItems"+vertexBuffer.numItems);
    // console.log("vertexNormalBuffer.numItems"+vertexNormalBuffer.numItems);
    // console.log("vertexTextureBuffer.numItems"+vertexTextureBuffer.numItems);
    // // console.log("vertexTextureIndexBuffer.numItems"+vertexTextureIndexBuffer.numItems);
    // console.log("kaBuffer.numItems"+kaBuffer.numItems);
    // console.log("ksBuffer.numItems"+ksBuffer.numItems);
    // console.log("kdBuffer.numItems"+kdBuffer.numItems);
    // console.log("NBuffer.numItems"+nBuffer.numItems);


}


/**
* Main rendering function.
*/
// var fps = 30;
var start,end;
function startRendering()
{

		// clear the canvas
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		start = new Date().getTime(); 
       
        render();
        end = new Date().getTime(); 

        // console.log("FPS -> " + 1000/(end - start));
        var frameTime = end - start;
        var string = "Frametime "+frameTime +" FPS "+(1000/frameTime) 
        renderText(string);   
         requestAnimationFrame(startRendering);
}
function render() {
	
	
	// console.log(pMatrix);
	var curGroups;
	var startIndex = 0;
	var finalIndex = 0;
	var inFrustum = true;
	texCount = 0;
	// console.log("Object length "+objects.length);
	
	for (var i = 0; i < objects.length; i++) {
		gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
	    gl.enableVertexAttribArray(shaderProgram.vertexTextureAttribute);
	    gl.enableVertexAttribArray(shaderProgram.ambientLightAttribue);
	    gl.enableVertexAttribArray(shaderProgram.specularLightAttribute);
	    gl.enableVertexAttribArray(shaderProgram.diffuseLightAttribute);
	    gl.enableVertexAttribArray(shaderProgram.nValAttribute);
	    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
		
		curGroups = objects[i].groups;

		mat4.perspective(pMatrix,45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
	
    mat4.identity(mvMatrix);
    mat4.lookAt(mvMatrix,vertE,vecLookAt,[0,1,0]);
  	buildFrustum();
   	inFrustum = objectInFrustum(objects[i]); 
    mat4.multiply(mvMatrix,mvMatrix,objects[i].transformMat);
  
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexTextureBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexTextureAttribute, vertexTextureBuffer.itemSize, gl.FLOAT, false, 0, 0);

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
 
   	setMatrixUniforms();
   	   
   	console.log("Object in frustum "+i+"   -> "+inFrustum);
	for (var j = 0;  objects[i].containsObj && j < curGroups.length  ; j++) {
			
			finalIndex += curGroups[j].faces.v.length/3
	
		if(inFrustum == true)
		{
			if(texImages[texCount]!="")
			{
				gl.activeTexture(gl.TEXTURE0);
		  		gl.bindTexture(gl.TEXTURE_2D, textures[texCount]);
		  		gl.uniform1i(shaderProgram.samplerUniform1, 0);
	  		}
			
	  		gl.uniform1i(gl.getUniformLocation(shaderProgram, "isBoundingBox"),0);



			// draw the triangle
			gl.drawArrays(gl.TRIANGLES, startIndex, finalIndex -startIndex);
		}
			// console.log("startIndex "+startIndex +",    finalIndex   " +(finalIndex- startIndex));
			startIndex = finalIndex;
			texCount++;
		}


		gl.disableVertexAttribArray(shaderProgram.vertexNormalAttribute);
	    gl.disableVertexAttribArray(shaderProgram.vertexTextureAttribute);
	    gl.disableVertexAttribArray(shaderProgram.ambientLightAttribue);
	    gl.disableVertexAttribArray(shaderProgram.specularLightAttribute);
	    gl.disableVertexAttribArray(shaderProgram.diffuseLightAttribute);
	    gl.disableVertexAttribArray(shaderProgram.nValAttribute);
	    gl.disableVertexAttribArray(shaderProgram.vertexPositionAttribute);
	

				//Render Bounding Box
				if((i == selectedObject || selectedObject == -1) && showBoundingBox && inFrustum)
				{			
			     	gl.enableVertexAttribArray(shaderProgram.boxVertexPositionAttribute);
			     	renderCube(objects[i]);
			     	gl.disableVertexAttribArray(shaderProgram.boxVertexPositionAttribute);
			    }

			    
			 

	}
	

			     
	
}


function renderCube(object)
{
	console.log("Rendering Cube");
	var cubeVertices = new Array();
	var minX = object.minX;			var maxX = object.maxX;
	var minY = object.minY;			var maxY = object.maxY;
	var minZ = object.minZ;			var maxZ = object.maxZ;
	
	cubeVertices = [minX,minY,minZ,minX,minY,maxZ,minX,minY,maxZ,maxX,minY,maxZ,maxX,minY,maxZ,maxX,minY,minZ,maxX,minY,minZ,minX,minY,minZ,
					minX,maxY,minZ,minX,maxY,maxZ,minX,maxY,maxZ,maxX,maxY,maxZ,maxX,maxY,maxZ,maxX,maxY,minZ,maxX,maxY,minZ,minX,maxY,minZ,
					minX,minY,minZ,minX,maxY,minZ,minX,minY,maxZ,minX,maxY,maxZ,maxX,minY,minZ,maxX,maxY,minZ,maxX,minY,maxZ,maxX,maxY,maxZ];

	
	gl.bindBuffer(gl.ARRAY_BUFFER, wireframeBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertices), gl.STATIC_DRAW);
	wireframeBuffer.itemSize = 3;
	wireframeBuffer.numItems = cubeVertices.length/3;
	gl.uniform1i(gl.getUniformLocation(shaderProgram, "isBoundingBox"),1);
	// gl.uniform1f(shaderProgram.uBox,1);
	gl.bindBuffer(gl.ARRAY_BUFFER, wireframeBuffer);
	gl.vertexAttribPointer(shaderProgram.boxVertexPositionAttribute, wireframeBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.drawArrays(gl.LINES, 0, wireframeBuffer.numItems);
}

function renderText(string)
{
	x = -0.9;
	y = 0.9;
	textVertices = [];
	textTextures = [];
	for (var i = 0; i < string.length; i++) {
		textVertices.push(x + (i*fontSize));
		textVertices.push(y + (fontSize));
		textVertices.push(0);

		textVertices.push(x+(i*fontSize));
		textVertices.push(y);
		textVertices.push(0);

		textVertices.push(x+(i*fontSize)+fontSize);
		textVertices.push(y + (fontSize));
		textVertices.push(0);

		textVertices.push(x+(i*fontSize)+fontSize);
		textVertices.push(y);
		textVertices.push(0);

		textVertices.push(x+(i*fontSize)+fontSize);
		textVertices.push(y + (fontSize));
		textVertices.push(0);

		textVertices.push(x+(i*fontSize));
		textVertices.push(y);
		textVertices.push(0);


		var ch  = string.charCodeAt(i);
		var uv_x = (ch%16)/16.0;
     	var uv_y = (Math.floor(ch/16))/16.0;

		textTextures.push(uv_x);
		textTextures.push(1.0 - uv_y);

		textTextures.push(uv_x);
		textTextures.push(1.0 - (uv_y + 1.0/16.0));

		textTextures.push(uv_x + 1.0/16.0);
		textTextures.push(1.0 - uv_y);

		textTextures.push(uv_x + 1.0/16.0);
		textTextures.push(1.0 - (uv_y + 1.0/16.0));

		textTextures.push(uv_x + 1.0/16.0);
		textTextures.push(1.0 - uv_y);

		textTextures.push(uv_x);
		textTextures.push(1.0 - (uv_y + 1.0/16.0));



	};

	gl.enableVertexAttribArray(shaderProgram.textVertexAttribute);
	gl.enableVertexAttribArray(shaderProgram.textTextureAttribute);

	textBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, textBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textVertices), gl.STATIC_DRAW);
	textBuffer.itemSize = 3;
	textBuffer.numItems = textVertices.length/3;

	textTextureBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, textTextureBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textTextures), gl.STATIC_DRAW);
	textTextureBuffer.itemSize = 2;
	textTextureBuffer.numItems = textTextures.length/2;


	gl.bindBuffer(gl.ARRAY_BUFFER, textBuffer);
	gl.vertexAttribPointer(shaderProgram.textVertexAttribute, textBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, textTextureBuffer);
	gl.vertexAttribPointer(shaderProgram.textTextureAttribute, textTextureBuffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.uniform1i(shaderProgram.isText,1);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, fontTexture);
	gl.uniform1i(shaderProgram.samplerUniform1, 0);


	gl.drawArrays(gl.TRIANGLES,0,textBuffer.numItems);// Render Text


	gl.disableVertexAttribArray(shaderProgram.textVertexAttribute);
	gl.disableVertexAttribArray(shaderProgram.textTextureAttribute);
	gl.uniform1i(shaderProgram.isText,0);

	// console.log("Text Vertexs " + textVertices);
	// console.log("Text Texture " + textTextures);

}

function handleKeyDown(event) {
    
    var keyCode = event.keyCode;
    // console.log("Key Pressed "+event.keyCode);

    //Small Z pressed
	if (keyCode == 90 && !shiftPressed) {

        zDir = 0.3;
    } else if (keyCode == 90 && shiftPressed) {// Cap Z

        zDir = -0.3;
    }else
    {
    	zDir = 0;
    }

     //Small X pressed
	if (keyCode == 88 && !shiftPressed) {

        xDir = 0.3;
    } else if (keyCode == 88 && shiftPressed) {// Cap X

        xDir = -0.3;
    } 
    else
    {
    	xDir = 0;
    }


     //Small Y pressed
	if (keyCode == 89 && shiftPressed == false) {

        yDir = 0.3;
    } else if (keyCode == 89 && shiftPressed == true) { // Cap Y

        yDir = -0.3;
    } else
    {
    	yDir = 0
    }


    if(keyCode == 16)
    	shiftPressed = true;


    if (keyCode == 38) {
        rotateX = -Math.PI/90;
    } else if (keyCode == 40) {
        rotateX = Math.PI/90;
    }else{
    	rotateX = 0;
    }


    if (keyCode == 37) {
        rotateY = -Math.PI/90;
    } else if (keyCode == 39) {
        rotateY = Math.PI/90;
    } else{
    	rotateY = 0;
    }




	if(keyCode == 32)
		{
			if(selectedObject < objects.length-1)
				selectedObject++;
			else if(selectedObject == objects.length - 1)
				selectedObject = 0;

		}
		
	if(keyCode == 66)
		{
			if(showBoundingBox == true)
				showBoundingBox = false
			else
				showBoundingBox = true;

			selectedObject = -1;
		}
		
   vec3.set(vertE,vertE[0]+xDir,vertE[1]+yDir,vertE[2]+zDir);
   vec3.set(vecLookAt,vecLookAt[0]+xDir,vecLookAt[1]+yDir,vecLookAt[2]+zDir);
   
   if(rotateX != 0 || rotateY != 0)
   {
   var rotatationMatrix = mat4.create();
   mat4.identity(rotatationMatrix);
   mat4.rotate(rotatationMatrix,rotatationMatrix,rotateY,[0,1,0]);
   vec3.subtract(vecLookAt,vecLookAt,vertE);
   vec3.transformMat4(vecLookAt,vecLookAt,rotatationMatrix);
   vec3.add(vecLookAt,vecLookAt,vertE);

   rotatationMatrix = mat4.create();
   mat4.identity(rotatationMatrix);
   mat4.rotate(rotatationMatrix,rotatationMatrix,rotateX,[1,0,0]);
   vec3.subtract(vecLookAt,vecLookAt,vertE);
   vec3.transformMat4(vecLookAt,vecLookAt,rotatationMatrix);
   vec3.add(vecLookAt,vecLookAt,vertE);

    
   
	}
	// startRendering();
	// render();

}

function handleKeyUp(event) {

	var keyCode = event.keyCode;
	if(keyCode == 16)
    	shiftPressed = false;

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
	vec3.set(vertE,0,5,8);
	vec3.set(vertL,0,5,8);
	vec3.set(vecLookAt,0,5,0);

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


	var queryString = window.location.search.substring(0);
	var queryData = queryString.split("=");
	var objModels = new Array();
	if(queryData[0] == "?hierarchy")
		readFile(queryData[1]);
	else
		{
			console.log("Please check query string format ?hierarchy=model.txt");
			return;
		}
		buildHierarchy(0);
	var center = scene.getObjectCenter();
	
	// load shaders and bind arrays
	init();
	gl.enable(gl.DEPTH_TEST);
	
	

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
// function parseHierarchy(content)
// {

//  var lines = content.split("\n");
// 	var groupIndex = -1;
// 	var curLine,data;
	
// 	for (var i = 0; i < lines.length; i++) {
// 		  curLine = lines[i].trim();
// 		  data = curLine.split(" ");





// 		}

// }
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
		  else if(data[0] == "objModel")
		  {
		  	data.shift();
		  	var obj; 
		  	if(data[0] == "NOOBJ")
		  	{
		  		obj = new Object();
		  		obj.containsObj = false;
		  		obj.center = [0,0,0];
		  		obj.minX = 100; obj.maxX = -100;
		  		obj.minY = 100; obj.maxY = -100;
		  		obj.minZ = 100; obj.maxZ = -100;
		  		obj.scale = 1;
		  	}else
		  	{
		  		obj = scene.loadObjectFiles(data[0]);
		  		obj.containsObj = true;
		  		// obj.scale = 1;
		  	}
		  	
		  	// console.log("\n"+obj.groups.length);
		  	i++;
		  	curLine = lines[i].trim();
		  	data = curLine.split(" ");
		  	if(data[0] == "transform")
		  	{
			  	data.shift();
			  	obj.transform = new Array();
			  	if(data[0] == "IDENTITY")
			  		obj.transform = [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
			  	else
			  		obj.transform.push.apply(obj.transform,data);

			  	obj.transformMat = mat4.create();
			  	mat4.copy(obj.transformMat,obj.transform);
			  

			  	obj.transformMins = vec3.create();
			  	obj.transformMaxs = vec3.create();
			  	
			  	
			  	
		  	}

		  	i++;
		  	curLine = lines[i].trim();
		  	data = curLine.split(" ");
		  	if(data[0] == "child")
		  	{
			  	data.shift();
			  	obj.childrens = parseInt(data[0]);
		  	}


		  	objects.push(obj);
		  	// console.log("Obj model length"+objects.length);
		  }

		  // else if (data[0] == "loadOBJ")
		  // {
		  // 	data.shift();
		  // 	objModels.push.apply(objModels,data);
		  	
		  // }


		}
		
		
	  
		

		// console.log(" Models to load "+objModels);

}
var hierarchyCount = 0;
function buildHierarchy(index)
{

	// console.log(" Index  "+index +"  childrens "+parseInt(objects[index].childrens)+" hierarchyCount "+hierarchyCount);
	for (var i = 1; i <= parseInt(objects[index].childrens); i++) {
		
		var x = ++hierarchyCount;
		

		if(objects[hierarchyCount].childrens > 0)
			buildHierarchy(hierarchyCount);
		

			var temp = vec4.create();
		  	var res = vec4.create();
		  	var obj = objects[x];
		  	vec4.set(temp,obj.minX,obj.minY,obj.minZ,1);
		  	vec4.transformMat4(res,temp,obj.transformMat);
		  	// console.log("1 Result "+res +"  temp "+temp +"Transform "+obj.transformMat );
		  	vec3.set(obj.transformMins,res[0],res[1],res[2]);

		  	vec4.set(temp,obj.maxX,obj.maxY,obj.maxZ,1);
		  	vec4.transformMat4(res,temp,obj.transformMat);
		  	// console.log("2 Result "+res +"  temp "+temp +"Transform "+obj.transformMat );
		  	vec3.set(obj.transformMaxs,res[0],res[1],res[2]);

		  	mat4.multiply(objects[x].transformMat,objects[index].transformMat,objects[x].transformMat);

		  	objects[x] = obj;
			objects[index].minX = Math.min(objects[index].minX,objects[x].transformMins[0]);
			objects[index].minY = Math.min(objects[index].minY,objects[x].transformMins[1]);
			objects[index].minZ = Math.min(objects[index].minZ,objects[x].transformMins[2]);
			objects[index].maxX = Math.max(objects[index].maxX,objects[x].transformMaxs[0]);
			objects[index].maxY = Math.max(objects[index].maxY,objects[x].transformMaxs[1]);
			objects[index].maxZ = Math.max(objects[index].maxZ,objects[x].transformMaxs[2]);

	};
		// console.log( "hierarchyCount "+hierarchyCount);


}

var viewFrustum;

/*
Frustum Culling code is referred from this website http://www.crownandcutlass.com/features/technicaldetails/frustum.html
*/
function buildFrustum ()
{
   var pMat;
   var mMat;
   var clip = [];
   var   t;

   viewFrustum = new Array(6);
   for (var i = 0; i < 6; i++) {
       
       viewFrustum[i] = new Array(4);
   };
    pMat = pMatrix;
    mMat = mvMatrix;

  

   /* Combine the two matrices (multiply pMatection by modelview) */
   clip[ 0] = mMat[ 0] * pMat[ 0] + mMat[ 1] * pMat[ 4] + mMat[ 2] * pMat[ 8] + mMat[ 3] * pMat[12];
   clip[ 1] = mMat[ 0] * pMat[ 1] + mMat[ 1] * pMat[ 5] + mMat[ 2] * pMat[ 9] + mMat[ 3] * pMat[13];
   clip[ 2] = mMat[ 0] * pMat[ 2] + mMat[ 1] * pMat[ 6] + mMat[ 2] * pMat[10] + mMat[ 3] * pMat[14];
   clip[ 3] = mMat[ 0] * pMat[ 3] + mMat[ 1] * pMat[ 7] + mMat[ 2] * pMat[11] + mMat[ 3] * pMat[15];

   clip[ 4] = mMat[ 4] * pMat[ 0] + mMat[ 5] * pMat[ 4] + mMat[ 6] * pMat[ 8] + mMat[ 7] * pMat[12];
   clip[ 5] = mMat[ 4] * pMat[ 1] + mMat[ 5] * pMat[ 5] + mMat[ 6] * pMat[ 9] + mMat[ 7] * pMat[13];
   clip[ 6] = mMat[ 4] * pMat[ 2] + mMat[ 5] * pMat[ 6] + mMat[ 6] * pMat[10] + mMat[ 7] * pMat[14];
   clip[ 7] = mMat[ 4] * pMat[ 3] + mMat[ 5] * pMat[ 7] + mMat[ 6] * pMat[11] + mMat[ 7] * pMat[15];

   clip[ 8] = mMat[ 8] * pMat[ 0] + mMat[ 9] * pMat[ 4] + mMat[10] * pMat[ 8] + mMat[11] * pMat[12];
   clip[ 9] = mMat[ 8] * pMat[ 1] + mMat[ 9] * pMat[ 5] + mMat[10] * pMat[ 9] + mMat[11] * pMat[13];
   clip[10] = mMat[ 8] * pMat[ 2] + mMat[ 9] * pMat[ 6] + mMat[10] * pMat[10] + mMat[11] * pMat[14];
   clip[11] = mMat[ 8] * pMat[ 3] + mMat[ 9] * pMat[ 7] + mMat[10] * pMat[11] + mMat[11] * pMat[15];

   clip[12] = mMat[12] * pMat[ 0] + mMat[13] * pMat[ 4] + mMat[14] * pMat[ 8] + mMat[15] * pMat[12];
   clip[13] = mMat[12] * pMat[ 1] + mMat[13] * pMat[ 5] + mMat[14] * pMat[ 9] + mMat[15] * pMat[13];
   clip[14] = mMat[12] * pMat[ 2] + mMat[13] * pMat[ 6] + mMat[14] * pMat[10] + mMat[15] * pMat[14];
   clip[15] = mMat[12] * pMat[ 3] + mMat[13] * pMat[ 7] + mMat[14] * pMat[11] + mMat[15] * pMat[15];

   /* Extract the numbers for the RIGHT plane */
   viewFrustum[0][0] = clip[ 3] - clip[ 0];
   viewFrustum[0][1] = clip[ 7] - clip[ 4];
   viewFrustum[0][2] = clip[11] - clip[ 8];
   viewFrustum[0][3] = clip[15] - clip[12];

   /* Normalize the result */
   t = Math.sqrt( viewFrustum[0][0] * viewFrustum[0][0] + viewFrustum[0][1] * viewFrustum[0][1] + viewFrustum[0][2] * viewFrustum[0][2] );
   viewFrustum[0][0] /= t;
   viewFrustum[0][1] /= t;
   viewFrustum[0][2] /= t;
   viewFrustum[0][3] /= t;

   /* Extract the numbers for the LEFT plane */
   viewFrustum[1][0] = clip[ 3] + clip[ 0];
   viewFrustum[1][1] = clip[ 7] + clip[ 4];
   viewFrustum[1][2] = clip[11] + clip[ 8];
   viewFrustum[1][3] = clip[15] + clip[12];

   /* Normalize the result */
   t = Math.sqrt( viewFrustum[1][0] * viewFrustum[1][0] + viewFrustum[1][1] * viewFrustum[1][1] + viewFrustum[1][2] * viewFrustum[1][2] );
   viewFrustum[1][0] /= t;
   viewFrustum[1][1] /= t;
   viewFrustum[1][2] /= t;
   viewFrustum[1][3] /= t;

   /* Extract the BOTTOM plane */
   viewFrustum[2][0] = clip[ 3] + clip[ 1];
   viewFrustum[2][1] = clip[ 7] + clip[ 5];
   viewFrustum[2][2] = clip[11] + clip[ 9];
   viewFrustum[2][3] = clip[15] + clip[13];

   /* Normalize the result */
   t = Math.sqrt( viewFrustum[2][0] * viewFrustum[2][0] + viewFrustum[2][1] * viewFrustum[2][1] + viewFrustum[2][2] * viewFrustum[2][2] );
   viewFrustum[2][0] /= t;
   viewFrustum[2][1] /= t;
   viewFrustum[2][2] /= t;
   viewFrustum[2][3] /= t;

   /* Extract the TOP plane */
   viewFrustum[3][0] = clip[ 3] - clip[ 1];
   viewFrustum[3][1] = clip[ 7] - clip[ 5];
   viewFrustum[3][2] = clip[11] - clip[ 9];
   viewFrustum[3][3] = clip[15] - clip[13];

   /* Normalize the result */
   t = Math.sqrt( viewFrustum[3][0] * viewFrustum[3][0] + viewFrustum[3][1] * viewFrustum[3][1] + viewFrustum[3][2] * viewFrustum[3][2] );
   viewFrustum[3][0] /= t;
   viewFrustum[3][1] /= t;
   viewFrustum[3][2] /= t;
   viewFrustum[3][3] /= t;

   /* Extract the FAR plane */
   viewFrustum[4][0] = clip[ 3] - clip[ 2];
   viewFrustum[4][1] = clip[ 7] - clip[ 6];
   viewFrustum[4][2] = clip[11] - clip[10];
   viewFrustum[4][3] = clip[15] - clip[14];

   /* Normalize the result */
   t = Math.sqrt( viewFrustum[4][0] * viewFrustum[4][0] + viewFrustum[4][1] * viewFrustum[4][1] + viewFrustum[4][2] * viewFrustum[4][2] );
   viewFrustum[4][0] /= t;
   viewFrustum[4][1] /= t;
   viewFrustum[4][2] /= t;
   viewFrustum[4][3] /= t;

   /* Extract the NEAR plane */
   viewFrustum[5][0] = clip[ 3] + clip[ 2];
   viewFrustum[5][1] = clip[ 7] + clip[ 6];
   viewFrustum[5][2] = clip[11] + clip[10];
   viewFrustum[5][3] = clip[15] + clip[14];

   /* Normalize the result */
   t = Math.sqrt( viewFrustum[5][0] * viewFrustum[5][0] + viewFrustum[5][1] * viewFrustum[5][1] + viewFrustum[5][2] * viewFrustum[5][2] );
   viewFrustum[5][0] /= t;
   viewFrustum[5][1] /= t;
   viewFrustum[5][2] /= t;
   viewFrustum[5][3] /= t;
}


function objectInFrustum(object)
{
   var p;
   
   var tempMin = vec3.create();
   var tempMax = vec3.create();
   var b1= true;
   var b2= true;
   var b3= true;
   var b4= true;
   var b5= true;
   var b6= true;
   var b7= true;
   var b8= true;

   
   
   			vec3.set(tempMin,object.minX,object.minY,object.minZ);
   			vec3.set(tempMax,object.maxX,object.maxY,object.maxZ);
   			vec3.transformMat4(tempMin,tempMin,object.transformMat);
   			vec3.transformMat4(tempMax,tempMax,object.transformMat);
 
   for( p = 0; p < 6; p++ )
   {
      if(b1 && (viewFrustum[p][0] * tempMin[0] + viewFrustum[p][1] * tempMin[1] + viewFrustum[p][2] * tempMin[2]  + viewFrustum[p][3] <= 0 ))
         b1 = false;
      if(b2 && (viewFrustum[p][0] * tempMax[0] + viewFrustum[p][1] * tempMin[1] + viewFrustum[p][2] * tempMin[2]  + viewFrustum[p][3] <= 0 ))
         b2 = false;
      if(b3 && (viewFrustum[p][0] * tempMin[0] + viewFrustum[p][1] * tempMax[1] + viewFrustum[p][2] * tempMin[2]  + viewFrustum[p][3] <= 0 ))
         b3 = false;
      if(b4 && (viewFrustum[p][0] * tempMax[0] + viewFrustum[p][1] * tempMax[1] + viewFrustum[p][2] * tempMin[2]  + viewFrustum[p][3] <= 0 ))
         b4 = false;
      if(b5 && (viewFrustum[p][0] * tempMin[0] + viewFrustum[p][1] * tempMin[1] + viewFrustum[p][2] * tempMax[2]  + viewFrustum[p][3] <= 0 ))
         b5 = false;
      if(b6 && (viewFrustum[p][0] * tempMax[0] + viewFrustum[p][1] * tempMin[1] + viewFrustum[p][2] * tempMax[2]  + viewFrustum[p][3] <= 0 ))
         b6 = false;
      if(b7 && (viewFrustum[p][0] * tempMin[0] + viewFrustum[p][1] * tempMax[1] + viewFrustum[p][2] * tempMax[2]  + viewFrustum[p][3] <= 0 ))
         b7 = false;
      if(b8 && (viewFrustum[p][0] * tempMax[0] + viewFrustum[p][1] * tempMax[1] + viewFrustum[p][2] * tempMax[2]  + viewFrustum[p][3] <= 0 ))
         b8 = false;
      // return false;
   }
   
   return (b1 || b2 || b3|| b4 || b5 || b6 || b7 || b8);
}

window.onload = main;