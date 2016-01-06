#version 330 core

// input vertex data, different for all executions of this shader.
layout( location = 0 ) in vec3 vertexPosition;
layout( location = 1 ) in vec3 vertexNormal;
layout( location = 2 ) in vec2 vTexcoord;
layout( location = 3 ) in vec2 textVertex;
layout( location = 4 ) in vec2 textTexCoord;
 uniform mat4 mvpMatrix;
 uniform mat4 uNMatrix;
 uniform mat4 mvMatrix;
 uniform int textureEnabled;
 uniform int isText;

 out vec3 transformedNormal;
 out vec3 vertexPos;
 out vec2 texCoord;
 flat out int texFlag;
 flat out int textFlag;
void main() {
	textFlag = isText;
	if(isText == 1)
	{
		gl_Position = vec4(textVertex,0.0,1.0);
		texCoord = textTexCoord;
		
	}
	else
	{
	gl_Position = mvpMatrix * vec4(vertexPosition,1.0);  
	vec4 tempPos = mvMatrix * vec4(vertexPosition,1.0);  
	vertexPos = vec3(tempPos)/tempPos.w;
	transformedNormal = (uNMatrix * vec4(vertexNormal,0)).xyz;
	texFlag = textureEnabled;
	if(textureEnabled == 1)
		texCoord = vTexcoord;
	}
}