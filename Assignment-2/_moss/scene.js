"use strict";
var scene = {};
var vertices=[],vertexNormal=[],vertexTexture=[],depthVal=[];//faces=[];
var groups = [];
var mtlData = [];
var groupIndex = -1;
var faceIndex = 0;
var vertE = [0,0,-2];//Eye Location
var vertL = [0,-5,-5];// Light Vector
var unitVector = [1,1,1];//Unit vector 
var zeroVector = [0,0,0];
var R,G,B;
var canvas;
var zDepth;
var La,Ld,Ls;
var ctx,imageData;
var smooth_shading = false;
var maxVal =[-100, -100, -100];
var minVal =[100, 100, 100];
var objCenter = [];
var objRange = [];
var scaleDown = 1;


scene.getObjectCenter = function getObjectCenter()
{

	return objCenter;
}

scene.getScaleValue = function getScaleValue()
{

	return scaleDown;
}
scene.loadObjectFiles = function loadObjectFiles(objModels)
{
	// var contents;
	var i;
	for (i = 0; i < objModels.length; i++) {
		scene.loadFile("models/"+objModels[i],"objFile");
		// console.log("Contents:--> "+contents);
		// scene.parseOBJContent(contents);
	};
    
    for ( i = 0; i < groups.length; i++) {
		 if(groups[i].mtlName == null)
		 {
		 	groups[i].mtlName = "Default";
		 	groups[i].Ka.push.apply(groups[i].Ka,unitVector);
		 	groups[i].Kd.push.apply(groups[i].Kd,unitVector);
		 	groups[i].Ks.push.apply(groups[i].Ks,unitVector);
		 }

		if(groups[i].Ka.length == 0)
		{
			groups[i].Ka.push.apply(groups[i].Ka,zeroVector);
		}
		
		if(groups[i].Kd.length == 0)
		{
			groups[i].Kd.push.apply(groups[i].Kd,zeroVector);
		}
		
		if(groups[i].Ks.length == 0)
		{
			groups[i].Ks.push.apply(groups[i].Ks,zeroVector);
		}
	 }
	console.log("Printing groups" +groups.length);
	objCenter[0] = (minVal[0] + maxVal[0])/2;
	objCenter[1] = (minVal[1] + maxVal[1])/2;
	objCenter[2] = (minVal[2] + maxVal[2])/2;

	for (var p = 0; p < groups.length; p++) {
 		console.log("Groups: " + groups[p].groupName+", MTL NAME "+groups[p].mtlName+" Vertices "+vertices.length/3+" Vertex Normal "+vertexNormal.length/3+
 		 	", v "+groups[p].faces.v.length/3+", vt "+groups[p].faces.vt.length/3+", vn"+groups[p].faces.vn.length/3+ 
 		 	", Ka "+groups[p].Ka+ ", Ks "+groups[p].Kd+ ", Ks "+groups[p].Ks+ ", N "+groups[p].N);
	 }
	 console.log("maxVal val"+maxVal);

				objRange[0] = maxVal[0] - minVal[0];
				objRange[1] = maxVal[1] - minVal[1];
				objRange[2] = maxVal[2] - minVal[2];

				var maxRange = Math.max(Math.max(objRange[0],objRange[1]),objRange[2]);
				scaleDown = maxRange/2;
				console.log("Scale ------> "+scaleDown);
	 return groups;
      
};

scene.loadFile = function loadFile(fileName,type)
{
	var newFile = new XMLHttpRequest();
    newFile.open("GET", fileName, false);
    var contents;
    newFile.onreadystatechange = function ()
    {
        if(newFile.readyState === 4)
        {
            if(newFile.status === 200 || newFile.status == 0)
            {
            	// console.log("Here " + newFile.responseText);
                contents = newFile.responseText;
                // console.log("Here " + contents);
                if(type == "objFile")
                	scene.parseOBJContent( contents);
                else if(type == "mtlFile")
                	scene.parseMTLContent(contents);
                
            }
        }
    }
    newFile.send(null);
    
};


scene.parseOBJContent = function parseOBJContent(content)
{

	var lines = content.split("\n");
	faceIndex += vertices.length/3;
	// console.log("faceIndex "+faceIndex+" length" +vertices.length);
	var curLine,data,faceData,l;
	var mtlFileName;
	for (var i = 0; i < lines.length; i++) {
		  curLine = lines[i].trim();
		  data = curLine.split(" ");
		 // console.log("Length "+lines.length+"Curr Line "+curLine);
		 // console.log("Data: "+data);
		 if(data[0] == "v")
		 {
		 
		 	data.shift();
		 	vertices.push.apply(vertices,data);
		 	maxVal[0] = Math.max(maxVal[0],(data[0]));
		 	maxVal[1] = Math.max(maxVal[1],(data[1]));
		 	maxVal[2] = Math.max(maxVal[2],(data[2]));

		 	minVal[0] = Math.min(minVal[0],(data[0]));
		 	minVal[1] = Math.min(minVal[1],(data[1]));
		 	minVal[2] = Math.min(minVal[2],(data[2]));
		 	
		 }
		 else if (data[0] == "mtllib")
		 {
		 	data.shift();
		 	mtlFileName = "models/"+data[0];
			
		 }
		 else if(data[0] == "vn")
		 {
		 	
		 	data.shift();
		 	vertexNormal.push.apply(vertexNormal,data);
		 
		 }
		 else if(data[0] == "vt")
		 {
		 	
		 	data.shift();
		 	vertexTexture.push.apply(vertexTexture,data);
		 
		 }

		else if(data[0] == "g" || data[0]== "group")
		 {
		 	data.shift();
		 	// console.log("Reading groups");



		 	if(data.length == 0 )
		 		continue;
		 	for (l = 0; l < groups.length && groupIndex != -1; l++) {
		 		if(groups[l].groupName == data[0])
		 			break;
		 	};
		 	// console.log("Reading groups"+ l+"---->"+groups.length);
		 	if(l==groups.length || groupIndex == -1)
		 		{
		 			// scaleDown = Math.max(Math.max(maxVal[0],maxVal[1]),maxVal[2]);

		 			l = ++groupIndex;
		 	

				 	groups[l] = new Object();
				 	groups[l].faces = new Object();
				 	groups[l].faces.v = new Array();
				 	groups[l].faces.vt = new Array();
				 	groups[l].faces.vn = new Array();
				 	groups[l].Ka = [];
				 	groups[l].Kd = [];
				 	groups[l].Ks = [];
				 	groups[l].N = 0;
				 	groups[l].illum = 1;
				 	groups[l].texMap = ""

				 	groups[l].groupName = data[0];
				 }
		 }

		
		 	if (data[0] == "usemtl") {

		 		data.shift();
		 		groups[l].mtlName = data[0];
		 		// console.log(l +"Exchanged "+data[0]);
		 	}


		  
		else if(data[0] == "f")
		 {
		 	data.shift();
		 	// Polygon Triangulation
		 	for (var d = 0; d < data.length - 2 ; d++) {
		 			
		 			faceData = data[0].split("/");
		 			
		 			groups[l].faces.v.push(vertices[(parseInt(faceData[0]) -1)*3+0]);
					groups[l].faces.v.push(vertices[(parseInt(faceData[0]) -1)*3+1]);
					groups[l].faces.v.push(vertices[(parseInt(faceData[0]) -1)*3+2]);
		 			for (var n = 0; n < 3; n++) {
		 				
			 			
					 	if(faceData[1] && n < 2)
					 	groups[l].faces.vt.push(vertexTexture[(parseInt(faceData[1]) -1)*3+n]);
					 	if(faceData[2])
					 	groups[l].faces.vn.push(vertexNormal[(parseInt(faceData[2]) -1)*3+n]);
				 };
		 	 // console.log("Face Data"+faceData);

				 	for (var t = 1; t <= 2; t++) {
				 		
				 		faceData = data[d+t].split("/");
				 		groups[l].faces.v.push(vertices[(parseInt(faceData[0]) -1)*3+0]);
						groups[l].faces.v.push(vertices[(parseInt(faceData[0]) -1)*3+1]);
						groups[l].faces.v.push(vertices[(parseInt(faceData[0]) -1)*3+2]);
					 	for (n = 0; n < 3; n++) {

				 			
						 	if(faceData[1] && n < 2)
						 	groups[l].faces.vt.push(vertexTexture[(parseInt(faceData[1]) -1)*3+n]);
						 	if(faceData[2])
						 	groups[l].faces.vn.push(vertexNormal[(parseInt(faceData[2]) -1)*3+n]);
				 		};

					 };

		 	};
		 }
		
		
				


	}
		if(mtlFileName!= null)
			(scene.loadFile(mtlFileName,"mtlFile"));
		
	
}
scene.parseMTLContent = function parseMTLContent(content)
{

	var lines = content.split("\n");
	var mtlIndex = -1;
	var curLine,data,l;
	
	for (var i = 0; i < lines.length; i++) {
		  curLine = lines[i].trim();
		  data = curLine.split(" ");
		
			 if(data[0] == "newmtl")
			 {
			 		data.shift();
			 		++mtlIndex;
			 		mtlData[mtlIndex] = new Object();
			 		mtlData[mtlIndex].name = data[0];
			 		mtlData[mtlIndex].Ka = new Array();
			 		mtlData[mtlIndex].Kd = new Array();
			 		mtlData[mtlIndex].Ks = new Array();
			 		mtlData[mtlIndex].N = 0;
			 		mtlData[mtlIndex].texMap = "";
			 		


			 		
				// console.log("Index for l "+l);
			}
			

		  	else if(data[0] == "Ka")
		  	{
		  		data.shift();
		  		mtlData[mtlIndex].Ka.push.apply(mtlData[mtlIndex].Ka,data);
		  	}

		  	else if(data[0] == "map_Kd")
		  	{
		  		data.shift();
		  		mtlData[mtlIndex].texMap  = data [0];
		  	}
  	
		  	else if(data[0] == "Kd")
		  	{
		  		data.shift();
		  		mtlData[mtlIndex].Kd.push.apply(mtlData[mtlIndex].Kd,data);
		  	}


		  	else if(data[0] == "Ks")
		  	{
		  		data.shift();
		  		mtlData[mtlIndex].Ks.push.apply(mtlData[mtlIndex].Ks,data);
		  	}


		  	else if(data[0] == "Ns")
		  	{
		  		data.shift();
		  		mtlData[mtlIndex].N = data[0];
		  	}
		  	else if(data[0] == "N")
		  	{
		  		data.shift();
		  		mtlData[mtlIndex].N = data[0]*canvas.width/2000;
		  	}
		  	

		 	


		 }

		 for (var i = 0; i < mtlData.length; i++) {
		 	// console.log((i+1)+"  ---->  "+mtlData[i].name+" "+mtlData[i].Ka+" "+mtlData[i].Ks+" "+mtlData[i].Kd+" "+mtlData[i].N);

		 	for (var j = 0; j < groups.length; j++) {
		 		if(groups[j].mtlName == mtlData[i].name )
		 		{
		 			groups[j].Ka = mtlData[i].Ka;
		 			groups[j].Ks = mtlData[i].Ks;
		 			groups[j].Kd = mtlData[i].Kd;
		 			groups[j].N = mtlData[i].N;
		 			groups[j].texMap = mtlData[i].texMap;
		 		}
		 	};
		 };
		 	//   console.log("Vertices : "+ vertices);
			


}


