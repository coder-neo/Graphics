"use strict";
var scene = {};
var vertices=[],vertexNormal=[],vertexTexture=[],depthVal=[];//faces=[];
var groups = [];
var groupIndex = -1;
var faceIndex = 0;
var vertE = [0,0,-2];//Eye Location
var vertL = [0,-5,0];// Light Vector
var unitVector = [1,1,1];//Unit vector 
var zeroVector = [0,0,0];
var R,G,B;
var canvas;
var zDepth;
var La,Ld,Ls;
var ctx,imageData;
var smooth_shading = false;
var scale = 1;
var lightSources = [];
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
	 }	
	for (var p = 0; p < groups.length; p++) {
 		console.log("Groups: " + groups[p].groupName+", MTL NAME "+groups[p].mtlName+" Vertices "+vertices.length/3+" Vertex Normal "+vertexNormal.length/3+
 		 	", v "+groups[p].faces.v.length/3+", vt "+groups[p].faces.vt.length/3+", vn"+groups[p].faces.vn.length/3+ 
 		 	", Ka "+groups[p].Ka+ ", Ks "+groups[p].Kd+ ", Ks "+groups[p].Ks+ ", N "+groups[p].N);
	 }

      scene.findRayIntersections();
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
	console.log("faceIndex "+faceIndex+" length" +vertices.length);
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

		 			l = ++groupIndex;
		 	

				 	groups[l] = new Object();
				 	groups[l].faces = new Object();
				 	groups[l].faces.v = [];
				 	groups[l].faces.vt = [];
				 	groups[l].faces.vn = [];
				 	groups[l].Ka = [];
				 	groups[l].Kd = [];
				 	groups[l].Ks = [];
				 	groups[l].N = 0;
				 	groups[l].illum = 1;
				 	

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
		 			groups[l].faces.v.push(parseInt(faceData[0]) + parseInt(faceIndex));
				 	if(faceData[1])
				 	groups[l].faces.vt.push(parseInt(faceData[1]) + parseInt(faceIndex));
				 	if(faceData[2])
				 	groups[l].faces.vn.push(parseInt(faceData[2]) + parseInt(faceIndex));
		 	// console.log("Face Data"+faceData);

				 	for (var t = 1; t <= 2; t++) {
				 		
					 		faceData = data[d+t].split("/");
						 	groups[l].faces.v.push(parseInt(faceData[0]) + parseInt(faceIndex));
						 	if(faceData[1])
						 	groups[l].faces.vt.push(parseInt(faceData[1]) + parseInt(faceIndex));
						 	if(faceData[2])
						 	groups[l].faces.vn.push(parseInt(faceData[2]) + parseInt(faceIndex));
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
	var groupIndex = -1;
	var curLine,data,l;
	
	for (var i = 0; i < lines.length; i++) {
		  curLine = lines[i].trim();
		  data = curLine.split(" ");
		
			 if(data[0] == "newmtl")
			 {
			 		data.shift();

			 		for (l = 0; l < groups.length; l++)
					{
			 			if(groups[l].mtlName == data[0])
			 				break;
					};
			 	
				console.log("Index for l "+l);
			}
			else if(l == groups.length)
			{
				continue;
			}

		  	else if(data[0] == "Ka")
		  	{
		  		data.shift();
		  		groups[l].Ka.push.apply(groups[l].Ka,data);
		  	}

		  	
		  	else if(data[0] == "Kd")
		  	{
		  		data.shift();
		  		groups[l].Kd.push.apply(groups[l].Kd,data);
		  	}


		  	else if(data[0] == "Ks")
		  	{
		  		data.shift();
		  		groups[l].Ks.push.apply(groups[l].Ks,data);
		  	}


		  	else if(data[0] == "Ns")
		  	{
		  		data.shift();
		  		groups[l].N = data[0];
		  	}
		  	else if(data[0] == "N")
		  	{
		  		data.shift();
		  		groups[l].N = data[0]*canvas.width/2000;
		  	}
		  	else if(data[0] == "illum")
		  	{
		  		data.shift();
		  		groups[l].illum = data[0];
		  	}

		 	


		 }
		 	//   console.log("Vertices : "+ vertices);
			 // console.log("vertexNormal : "+ vertexNormal);


}
scene.findRayIntersections = function findRayIntersections()
{
	
	
	console.log("findRayIntersections");
	ctx = canvas.getContext('2d');
 	imageData = ctx.getImageData(0, 0, canvas.width, canvas.height );
	La = 0.4;
	Ld = 0.8;
	Ls = 0.8;
 	for (var i = 0; i < imageData.width * imageData.height; i++) {
 		depthVal.push(1000);
 	};
 	
 	for (var g = 0; g <groups.length; g++) {
 		
 		if(groups[g].Ka.length == 0)
		{
			groups[g].Ka.push.apply(groups[g].Ka,zeroVector);
		}
		if(groups[g].Kd.length == 0)
		{
			groups[g].Kd.push.apply(groups[g].Kd,zeroVector);
		}
		if(groups[g].Ks.length == 0)
		{
			groups[g].Ks.push.apply(groups[g].Ks,zeroVector);
		}
 		
 		scene.checkRayTriangleIntersection(groups[g]);
	
	};
	
	
	ctx.putImageData( imageData, 0, 0 );



}


scene.checkRayTriangleIntersection = function checkRayTriangleIntersection(group)
{
		console.log("checkRayTriangleIntersection");
		var step = imageData.width/2;
		var vertA=[],vertB=[],vertC=[];// Traingle vertices
		var vectorAB =[], vectorAC =[],	vectorAE =[],vectorBC =[];
		var normal =[];
		var vN1 = [], vN2 = [], vN3 = [];
		
		var colorVector = [];
		var face;
		console.log("Calculating for "+group.groupName);
		face = group.faces;
		smooth_shading = false;
		//Shoot ray for every face in the group.
		for (var i = 0; i < face.v.length; i += 3) {

			vertA.length = 0;
			vertB.length = 0;
			vertC.length = 0;
			vN1.length = 0;
			vN2.length = 0;
			vN3.length = 0;

			for (var j = 0; j < 3; j++) {
				vertA.push(vertices[(face.v[i]-1)*3 +j]/scale);
				vertB.push(vertices[(face.v[i+1]-1)*3 +j]/scale);
				vertC.push(vertices[(face.v[i+2]-1)*3 +j]/scale);

				if(face.vn.length != 0)
				{
					vN1.push(vertexNormal[(face.vn[i]-1)*3 +j]);
					vN2.push(vertexNormal[(face.vn[i+1]-1)*3 +j]);
					vN3.push(vertexNormal[(face.vn[i+2]-1)*3 +j]);
					smooth_shading = true;
				}
			};
			// console.log("Triangle "+(i/3+1));
			// console.log("Face 1: "+faces[i]+", Face: 2: "+faces[i+1]+", Face: 3 "+faces[i+2]);
			// console.log("VertexA : "+vertexA+", VertexB: "+vertexB+", VertexC: "+vertexC);
			
			
			

		
			
		vectorAB = scene.generateVector(vertB,vertA);
		vectorAC = scene.generateVector(vertC,vertA);
		vectorBC = scene.generateVector(vertB,vertC);
		vectorAE = scene.generateVector(vertE,vertA);
		normal = scene.crossProduct(vectorAB,vectorBC);
		normal = scene.normalizeVector(normal);
		
				
		var t;
		var dir = [];
		var interP = [];
		var det, beta, gamma,alpha;
		var P = []; //Point
		var z;
		var index;
		for (var x = -1; x < 1; x += 1/step) {
			for (var y = 1; y > -1; y -= 1/step) {
				
					 z = -1;
				
				    interP.length =0;
					P[0] = x ;
					P[1] = y ;
					P[2] = z ;

					dir = scene.generateVector(vertE,P);
					
					//Determinant of matrix {AB AC dir}[t alpha beta] = AE

					//det = a(ei-hf) + b(gf -  di) + c(dh - eg);
					det = vectorAB[0]*(vectorAC[1]*dir[2]-vectorAC[2]*dir[1] ) +
						  vectorAB[1]*(vectorAC[2]*dir[0]-vectorAC[0]*dir[2] ) +
						  vectorAB[2]*(vectorAC[0]*dir[1]-vectorAC[1]*dir[0] );
					
					//Calculate value of T
					t = - (vectorAC[2]*(vectorAB[0]*vectorAE[1] - vectorAB[1]*vectorAE[0]) +
					       vectorAC[1]*(vectorAB[2]*vectorAE[0] - vectorAB[0]*vectorAE[2]) + 
					       vectorAC[0]*(vectorAB[1]*vectorAE[2] - vectorAB[2]*vectorAE[1]) ) / det;

					 if(t < 0)
					 	continue;
					interP[0] = vertE[0] + dir[0]*t;
					interP[1] = vertE[1] + dir[1]*t;
					interP[2] = vertE[2] + dir[2]*t;

					
					//Calculate value of beta
					beta = (vectorAE[0]*(vectorAC[1]*dir[2]-vectorAC[2]*dir[1] ) +
						   vectorAE[1]*(vectorAC[2]*dir[0]-vectorAC[0]*dir[2] ) +
						   vectorAE[2]*(vectorAC[0]*dir[1]-vectorAC[1]*dir[0] ))/det;

					if (beta < 0 || beta > 1) 
						continue;
						// console.log("2. beta--->"+beta);
					//Calculate value of gamma
					gamma = (dir[2]*(vectorAE[1]*vectorAB[0]-vectorAE[0]*vectorAB[1] ) +
						     dir[1]*(vectorAE[0]*vectorAB[2]-vectorAE[2]*vectorAB[0] ) +
						     dir[0]*(vectorAE[2]*vectorAB[1]-vectorAE[1]*vectorAB[2] ))/det;
					
					if (gamma < 0 || gamma > 1- beta) 
						continue; 

 				// 	if ((beta != 0 && gamma != 0 && (alpha)!=0))
					// 	continue;
					 // console.log("---->Beta "+beta+", gamma"+gamma+"alpha "+(alpha));
 					
 					//Compare Depth Index
					alpha = 1 - beta - gamma;
 					if(smooth_shading)
 					{
 						normal[0] =  vN1[0]*alpha + vN2[0]*beta + vN3[0]*gamma;
 						normal[1] =  vN1[1]*alpha + vN2[1]*beta + vN3[1]*gamma;
 						normal[2] =  vN1[2]*alpha + vN2[2]*beta + vN3[2]*gamma;
 					}
 					normal = scene.normalizeVector(normal);
 					// console.log("normal --->"+normal);
 					index = (x+1)*step + (1-y)*step*imageData.width;
 					if(depthVal[index] < interP[2])
					{	
						continue;
					}
					else
					{
						// console.log(" Replaced Depth val "+index+":  "+depthVal[index]+"Z val"+interP[2]);
					 	depthVal[(x+1)*step + (1-y)*step*imageData.width] = interP[2];
					}
 					
 					colorVector = scene.calculateColor(group, normal, P, dir);
 					
					setPixel(imageData, (1+x)*step, (1-y)*step, colorVector[0], colorVector[1], colorVector[2], 255);

				 

			}
			
		};
		
	};
}

scene.createStripes = function createStripes(P)
{
	var colorWhite = [255,255,255];
	var colorRed = [255,0,0];

	if(Math.sin((P[0]/P[2]+1)*100) > 0)// && Math.sin((P[1]+1)*100) > 0)
		return colorRed;
	else
		return colorWhite;


}

scene.calculateColor = function calculateColor(group, normal,P, dir)
{

		var lightVector,halfVecctor,val1,val2;
		var colorVector = [];
		var verL = [];

		for (var i = 0; i < lightSources.length/3; i+=3) {
			    verL[0] = lightSources[i];
			    verL[1] = lightSources[i+1];
			    verL[2] = lightSources[i+2];
		
		 lightVector = scene.generateVector(P,verL);
		 halfVecctor = scene.addVector(lightVector,dir);
		
		halfVecctor = scene.normalizeVector(halfVecctor);
		lightVector = scene.normalizeVector(lightVector);
		var val1 = scene.dotProduct(normal,lightVector);
		var val2 = Math.pow(scene.dotProduct(normal,halfVecctor),group.N);


		// console.log("Normal "+normal);
		// console.log("Light "+lightVector);
		// console.log("Val "+val1);
		// console.log("Ka"+group.Ka+" Kd "+group.Kd+", Ks : "+group.Ks+"   "+group.N);


		
		if(val1 < 0)
			val1 = val2 = 0;
		
		colorVector[0] = ( Ld*parseFloat(group.Kd[0])*val1 + Ls*parseFloat(group.Ks[0])*val2);
		colorVector[1] = ( Ld*parseFloat(group.Kd[1])*val1 + Ls*parseFloat(group.Ks[1])*val2);
		colorVector[2] = ( Ld*parseFloat(group.Kd[2])*val1 + Ls*parseFloat(group.Ks[2])*val2);



	
	};

		colorVector[0] = Math.min(colorVector[0] + La * parseFloat(group.Ka[0]),1)*255;
		colorVector[1] = Math.min(colorVector[1] + La * parseFloat(group.Ka[1]),1)*255;
		colorVector[2] = Math.min(colorVector[2] + La * parseFloat(group.Ka[2]),1)*255;
		return colorVector;

}

scene.dotProduct = function dotProduct(vecA,vecB)
{
	
	return vecA[0]*vecB[0]+ vecA[1]*vecB[1]+vecA[2]*vecB[2];

}

scene.setScale = function setScale(val)
{
	
	scale = val;

}

scene.setLightSources = function setLightSources(lights)
{
	
	lightSources = lights;

}

scene.crossProduct = function crossProduct(vecA,vecB) {
	var res = [];

		res.push(vecA[1]*vecB[2] - vecA[2]*vecB[1]);
		res.push(vecA[2]*vecB[0] - vecA[0]*vecB[2]);
		res.push(vecA[0]*vecB[1] - vecA[1]*vecB[0]);

	return res

}

scene.generateVector = function generateVector(vertA,vertB){
	var res = [];
		res.push(vertB[0] - vertA[0]);
		res.push(vertB[1] - vertA[1]);
		res.push(vertB[2] - vertA[2]);

	return res;
}

scene.addVector = function addVector(vertA,vertB){
	var res = [];
		res.push(vertB[0] + vertA[0]);
		res.push(vertB[1] + vertA[1]);
		res.push(vertB[2] + vertA[2]);

	return res;
}

scene.setPixel = function setPixel( imageData, x, y, r, g, b, a ) {
    index = ( x + y * imageData.width ) * 4;
    imageData.data[index+0] = r;
    imageData.data[index+1] = g;
    imageData.data[index+2] = b;
    imageData.data[index+3] = a;
}

scene.normalizeVector = function normalizeVector(normal){
	var normalVal = Math.sqrt(Math.pow(normal[0],2)+Math.pow(normal[1],2)+Math.pow(normal[2],2));
		normal[0] /= normalVal; 
		normal[1] /= normalVal; 
		normal[2] /= normalVal; 

	return normal;
}
