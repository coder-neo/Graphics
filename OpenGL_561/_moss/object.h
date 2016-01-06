#include<iostream>
#include<assert.h>
#include<unordered_map>

#include "tiny_obj_loader.h"
#include "SOIL.h"

class Object
{
	std::string m_objName;
	std::string m_mtlName;
	std::unordered_map<std::string, int> textureImageMap;
	unsigned char** textureImages;
	void loadObjectData();
	void loadTextureImages();
	
	struct Transforms{

		float objScale[3];
		float objTranslate[3];
		float rotationAngle;
	};

	struct TextureData{
		unsigned char* textureImage;
		int imageWidth;
		int imageHeight;

	};
	
	unsigned int *textureIndex;
	std::string err;
public:
	std::vector<tinyobj::shape_t> shapes;
	std::vector<tinyobj::material_t> materials;
	unsigned int boardPosition;
	unsigned int *vertexBuffer;
	unsigned int *indexBuffer;
	unsigned int *vNormalBuffer;
	unsigned int *vTextureBuffer;
	unsigned int *texImageBuffer;
	TextureData *objectTextureData;
	Transforms objectTransform;
	Object(){}
	Object(std::string objName, std::string m_mtlName);
	void toString();
	int getTextureIndex(size_t index);
	void initializeObjectTransform(float transX, float transY, float transZ, float scaleX, float scaleY, float scaleZ, float angle);
	

};