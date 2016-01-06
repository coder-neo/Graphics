#include"object.h"

Object::Object(std::string objName, std::string mtlName)
{
	m_objName = objName;
	m_mtlName = mtlName;
	loadObjectData();
	loadTextureImages();
}

void Object::loadTextureImages()
{

	textureIndex = new unsigned int[shapes.size()];
	std::string textureName;
	for (size_t i = 0; i < shapes.size(); i++)
	{
		textureIndex[i] = -1;
		textureName = materials[shapes[i].mesh.material_ids[0]].diffuse_texname;
		if (textureName.empty())
			continue;
		std::unordered_map<std::string, int>::const_iterator res = textureImageMap.find(textureName);

		if (res == textureImageMap.end())
		{
			textureImageMap.insert(std::pair<std::string, int>(textureName, i));
			textureIndex[i] = i;
		}
		else
		{
			textureIndex[i] = res->second;
		}

	}

	size_t texCount = textureImageMap.size();

	objectTextureData = new TextureData[texCount];
	std::string imageLocation;
	for (auto it = textureImageMap.begin(); it != textureImageMap.end(); ++it)
	{
		imageLocation = std::string("obj/").append(it->first);
		objectTextureData[it->second].textureImage = SOIL_load_image(imageLocation.c_str(), &objectTextureData[it->second].imageWidth, &objectTextureData[it->second].imageHeight, 0, SOIL_LOAD_RGB);;
	}
}

int Object::getTextureIndex(size_t index){

	return textureIndex[index];
}

void Object::loadObjectData()
{
	bool ret = tinyobj::LoadObj(shapes, materials, err, m_objName.c_str(),m_mtlName.c_str());
	if (!err.empty()) { // `err` may contain warning message.
		std::cerr <<"Failed to load file due to following error :\n "<< err << std::endl;
	}

	if (!ret) {
		exit(1);
	}
}

void Object::initializeObjectTransform(float transX, float transY, float transZ, float scaleX, float scaleY, float scaleZ, float angle)
{
	objectTransform.objTranslate[0] = transX;	objectTransform.objTranslate[1] = transY;	objectTransform.objTranslate[2] = transZ;
	objectTransform.objScale[0] = scaleX;	objectTransform.objScale[1] = scaleY;	objectTransform.objScale[2] = scaleZ;
	objectTransform.rotationAngle = angle;

}

void Object::toString()
{
	std::cout << "# of shapes    : " << shapes.size() << std::endl;
	std::cout << "# of materials : " << materials.size() << std::endl;

	for (size_t i = 0; i < shapes.size(); i++) {
		printf("shape[%ld].name = %s\n", i, shapes[i].name.c_str());
		printf("Size of shape[%ld].indices: %ld\n", i, shapes[i].mesh.indices.size());
		printf("Size of shape[%ld].material_ids: %ld\n", i, shapes[i].mesh.material_ids.size());
		//assert((shapes[i].mesh.indices.size() % 3) == 0);
		for (size_t f = 0; f < shapes[i].mesh.indices.size() / 3; f++) {
			printf("  idx[%ld] = %d, %d, %d. mat_id = %d\n", f, shapes[i].mesh.indices[3 * f + 0], shapes[i].mesh.indices[3 * f + 1], shapes[i].mesh.indices[3 * f + 2], shapes[i].mesh.material_ids[f]);
		}

		printf("shape[%ld].vertices: %ld\n", i, shapes[i].mesh.positions.size());
		assert((shapes[i].mesh.positions.size() % 3) == 0);
		for (size_t v = 0; v < shapes[i].mesh.positions.size() / 3; v++) {
			printf("  v[%ld] = (%f, %f, %f)\n", v,
				shapes[i].mesh.positions[3 * v + 0],
				shapes[i].mesh.positions[3 * v + 1],
				shapes[i].mesh.positions[3 * v + 2]);
		}

		for (size_t nl = 0; nl < shapes[i].mesh.positions.size() / 3; nl++) {
			printf("  n[%ld] = (%f, %f, %f)\n", nl,
				shapes[i].mesh.normals[3 * nl + 0],
				shapes[i].mesh.normals[3 * nl + 1],
				shapes[i].mesh.normals[3 * nl + 2]);
		}

	}

	for (size_t i = 0; i < shapes.size(); i++)
	{
		printf("Texture Index--->\n\nTextureIndex[%d] = %d\n",i,textureIndex[i]);
	}

	for (size_t i = 0; i < materials.size(); i++) {
		printf("material[%ld].name = %s\n", i, materials[i].name.c_str());
		printf("  material.Ka = (%f, %f ,%f)\n", materials[i].ambient[0], materials[i].ambient[1], materials[i].ambient[2]);
		printf("  material.Kd = (%f, %f ,%f)\n", materials[i].diffuse[0], materials[i].diffuse[1], materials[i].diffuse[2]);
		printf("  material.Ks = (%f, %f ,%f)\n", materials[i].specular[0], materials[i].specular[1], materials[i].specular[2]);
		printf("  material.Tr = (%f, %f ,%f)\n", materials[i].transmittance[0], materials[i].transmittance[1], materials[i].transmittance[2]);
		printf("  material.Ke = (%f, %f ,%f)\n", materials[i].emission[0], materials[i].emission[1], materials[i].emission[2]);
		printf("  material.Ns = %f\n", materials[i].shininess);
		printf("  material.Ni = %f\n", materials[i].ior);
		printf("  material.dissolve = %f\n", materials[i].dissolve);
		printf("  material.illum = %d\n", materials[i].illum);
		printf("  material.map_Ka = %s\n", materials[i].ambient_texname.c_str());
		printf("  material.map_Kd = %s\n", materials[i].diffuse_texname.c_str());
		printf("  material.map_Ks = %s\n", materials[i].specular_texname.c_str());
		printf("  material.map_Ns = %s\n", materials[i].specular_highlight_texname.c_str());
		std::map<std::string, std::string>::const_iterator it(materials[i].unknown_parameter.begin());
		std::map<std::string, std::string>::const_iterator itEnd(materials[i].unknown_parameter.end());
		for (; it != itEnd; it++) {
			printf("  material.%s = %s\n", it->first.c_str(), it->second.c_str());
		}
		printf("\n");
	}

}


// x-y bezier co-ordinates
//0.0, 0.0
//0.266, 0.02
//0.504, 0.08
//0.714, 0.18
//0.896, 0.32
//1.05, 0.5
//1.176, 0.72
//1.274, 0.98
//1.344, 1.28
//1.386, 1.62
//1.4, 2.0