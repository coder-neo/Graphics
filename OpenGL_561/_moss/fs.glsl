#version 330 core

// ouput data
out vec3 color;



 in vec3 transformedNormal;
 in vec3 vertexPos;
 in vec2 texCoord;
 flat in int texFlag;
 flat in int textFlag;
 struct MaterialData{
	vec3 uAmbientVal;
	vec3 uDiffuseVal;
	vec3 uSpecularVal;
	float shininess;
};

 const vec3 lightPos = vec3(-4.0,5.0,9.0);
 const vec3 eyePos = vec3(0.0,12.0,20.0);
 uniform MaterialData materialInfo;
 uniform sampler2D uSampler;
 

void main() {

	if(textFlag == 1)
	{
		color = vec3(texture( uSampler, vec2(texCoord.x,texCoord.y)));
	}
	else{

		vec3 normal = normalize(transformedNormal);
		vec3 lightDir = normalize(lightPos - vertexPos);
		vec3 directionVec = normalize(eyePos - vertexPos);
		vec3 halfVector = normalize(lightDir + directionVec);
		float val1 = dot(normal,lightDir);
		float val2 = pow(dot(normal,halfVector),materialInfo.shininess);
  
			if(val1 < 0.0)
				val1 =  0.0;
			else if(val2 < 0.0)
				val2 = 0.0;
 
		color.x = (materialInfo.uAmbientVal.x  +  val1 * materialInfo.uDiffuseVal.x + val2 * materialInfo.uSpecularVal.x);
		color.y = (materialInfo.uAmbientVal.y  +  val1 * materialInfo.uDiffuseVal.y + val2 * materialInfo.uSpecularVal.y);
		color.z = (materialInfo.uAmbientVal.z  +  val1 * materialInfo.uDiffuseVal.z + val2 * materialInfo.uSpecularVal.z);
		if(texFlag == 1){

			vec4 textureColor = texture( uSampler, vec2(texCoord.x,1- texCoord.y) );
		
			if(textureColor.a < 0.8) 
				discard;
		
			color = color * textureColor.rgb;

		}
	}
}