Following are the links from where reference was taken for tutorial and webGL code syntax:

1. http://learningwebgl.com/
2. https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
3. http://webglfundamentals.org/webgl/lessons


Reference for passing uniform array used for multiple light : http://stackoverflow.com/questions/30594511/webgl-fragment-shader-for-multiple-light-sources

Steps Followed in assignment :
1. Parse the obj and mtl files same as asssignment 1.
2. Scale the object and move the object to origin -> to support arbitary size image.
3. Load all the values in buffer by looping through all groups.
4. Pass the buffer to shader to render object.

I have supported only two textures as of now and maintaing the texture index in for vertices. As i am passing all data together in drawArray and rendering it once. 

Transformation :

I have changed the rotational Axis using keys 
(key  A) - for X axis
(key  S) - for Y axis
(key  D) - for Z axis

But as I have not implemented the stack to maintain model view matrix so the rotate value is reflected on changing rotational axis and things doesn't look good.

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


