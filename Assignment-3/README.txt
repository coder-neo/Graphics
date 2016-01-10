Following are the links from where reference was taken for tutorial and webGL code syntax:

1. http://learningwebgl.com/
2. https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
3. http://webglfundamentals.org/webgl/lessons
4. http://www.crownandcutlass.com/features/technicaldetails/frustum.html
5. http://www.opengl-tutorial.org/intermediate-tutorials/tutorial-11-2d-text/


Reference for passing uniform array used for multiple light : http://stackoverflow.com/questions/30594511/webgl-fragment-shader-for-multiple-light-sources

Steps Followed in assignment :
1. Parse the obj and mtl files same as asssignment 2.
2. Load all the values in buffer by looping through all groups.
3. Pass the buffer to shader to render object by looping through all groups.


Hierarchy is stored in models.txt
Query String ?objFilePath=models.txt
All OBJ, MTL and textures file are included in model. You just need to mention thre obj file name in query string> i have appended "model/" in code.

Extra Credits Completed :

1. Arbitrarily sized interface windows : 

window.txt you can change the canvas size by mentioning "window width height". The object is scaled and moved to origin so that any arbitary sized image can be viewed.

2. Multiple and arbitrarily located lights :

Multiple lights are supported by passsing the array of light position and values to shader through uniform array.
I have added the support for 5 lights
lights.txt contains light in following format
light posX posY posZ aR aG aB dR dG dB sR sG sB

3.Multiple image formats
Multiple image format are supported, used js image object to load image file. So I am able to load earth_text.jpg in case of earth model.


