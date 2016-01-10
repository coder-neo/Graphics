Files contained: 
----------------
JS - > 	scene.js   This file contains all the parsing and raycing casting code. From Intersection finding to coloring of the pixel.
		main.js    Initial environment setup and argument parsing on load.
		glMatrix   Included  but not used.
		
CSS -> same as starter project.

models -> 	contain obj and mtl file which can be loaded
			It also contains args.txt which mention which file to load.
			
args.txt -> window command specifies canvas width height
			loadOBJ command specifies which objFiles to upload. I have handled the code to add multiple obj files. But couldn't check well. Just checked by adding two cubes as it was easy to simulate. Rest of models had different co-ordinate range and required different scaling for each model.
			scale command scale the vertex coordinates.

Code Flow
-----------			
Scene.js parse the objFiles and mtlFiles mentioned. 

Structure of data :    Group(Object): 	Faces(Object): v(Array), vt(Array),vn(Array)
										groupName       
										mtlName
										Ka(Array)
										Kd(Array)
										Ks(Array)
										N
										
After parsing each group Object is sent for intersection checking, If intersection and depth criteria is fulfilled, color is computed and stored in ImageData. IF vertex normals are provided it will do smooth shading else it has been turned off.

Some of the models are taking much time to render such as AL and car rougly around 2-3 mins.


