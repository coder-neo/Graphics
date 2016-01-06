#include <windows.h>
#include <string>
#include <stdio.h>
#include <stdlib.h>
#include <vector>
#include <fstream>
#include <ctime>
#include <set>
#include <math.h>
using namespace std;

#define MODERN 
#define M_PI 3.14159265358979323846
//#define DEBUG
#ifdef MODERN

// include GLEW
#include "glew/glew.h"

// include GLFW
#include "glfw/glfw3.h"

//open AL
#include "al.h"
#include "alc.h"
#include "alut.h"


GLFWwindow* window;


//double translateZ = 1.437f;
//double translateX = -0.1038f;
//double translateY = -9.1874f;
//double scale = 0.00707f;
// include GLM
#include "glm/glm.hpp"
#include "glm/gtc/matrix_transform.hpp"
#include "object.h"
bool perspective = true;

struct ShaderInfo {
	GLuint programId;
	GLuint vertexArray;
};
std::clock_t start;
bool randomAllowed = false;
//unsigned int currentRow = 0;
//unsigned int boardPosition = 0;

struct ObjectMovement
{
	unsigned int currentRow;
	unsigned int boardPosition;
	unsigned int direction;
	float translate[3];
	float angle;
	bool render;
	unsigned int counter;
	void setPosition(unsigned int row, unsigned int pos, unsigned int dir){ currentRow = row; boardPosition = pos; direction = dir; render = true; }
	void setValues(float transX, float transY, float transZ, float r_angle){
		translate[0] = transX;  translate[1] = transY; translate[2] = transZ;  angle = r_angle;
	}
};
ObjectMovement  qbertPosition, coilyPosition, spherePosition,haunterPosition;

const std:: string soundSource[] = { "audio/Hop.wav", "audio/Fall.wav","audio/Kill.wav" };
unsigned int score = 0;
unsigned int counter = 0;
int soundIndex = -1;
float scale = 0.015f;
double duration,qStart,qEnd;
bool updated = true;
bool game_started = false;
bool game_finished = false;
bool level_complete = false;
bool level_animating = false;
bool reset_game = false;
bool sound_played = false;
bool reset_QBERT = false;
bool position_covered[28] = { false };
float disc_rotation = 0.0f;
float transition_rotation = 0.0f;
float transition_scale = 0.0f;
bool sphereUpdated = false;
bool haunterUpdated = false;
int lives = 2;
unsigned int qbertKilled = 0;
unsigned int materialIndex[2] = { 2, 1 };
GLuint textTexture;

ALuint buffer, *source;
 
void initAudioSetttings()
{
	alutInit(0, NULL);
	alGetError();
	
	source = new ALuint[3];
	for (size_t i = 0; i < 3; i++)
	{

	
	// Load pcm data into buffer
	buffer = alutCreateBufferFromFile(soundSource[i].c_str());
	// Create sound source (use buffer to fill source)
	alGenSources(1, &source[i]);
	alSourcei(source[i], AL_BUFFER, buffer);
	}
}

void playSound(int index)
{
	alSourcePlay(source[index]);
	ALint state;
	do {
		alGetSourcei(source[index], AL_SOURCE_STATE, &state);
	} while (state == AL_PLAYING);
	sound_played = true;
}

//struct MaterialData{
//	glm :: vec3 uAmbientVal;
//	glm :: vec3 uDiffuseVal;
//	glm :: vec3 uSpecularVal;
//	float shininess;
//};
GLuint LoadShaders(const char* vertex_file_path, const char* fragment_file_path){

	// Create the shaders
	GLuint VertexShaderID = glCreateShader(GL_VERTEX_SHADER);
	GLuint FragmentShaderID = glCreateShader(GL_FRAGMENT_SHADER);

	// Read the Vertex Shader code from the file
	std::string VertexShaderCode;
	std::ifstream VertexShaderStream(vertex_file_path, std::ios::in);
	if (VertexShaderStream.is_open()){
		std::string Line = "";
		while (getline(VertexShaderStream, Line))
			VertexShaderCode += "\n" + Line;
		VertexShaderStream.close();
	}
	else{
		printf("Impossible to open %s. Are you in the right directory ? Don't forget to read the FAQ !\n", vertex_file_path);
		getchar();
		return 0;
	}

	// Read the Fragment Shader code from the file
	std::string FragmentShaderCode;
	std::ifstream FragmentShaderStream(fragment_file_path, std::ios::in);
	if (FragmentShaderStream.is_open()){
		std::string Line = "";
		while (getline(FragmentShaderStream, Line))
			FragmentShaderCode += "\n" + Line;
		FragmentShaderStream.close();
	}



	GLint Result = GL_FALSE;
	int InfoLogLength;



	// Compile Vertex Shader
	printf("Compiling shader : %s\n", vertex_file_path);
	char const * VertexSourcePointer = VertexShaderCode.c_str();
	glShaderSource(VertexShaderID, 1, &VertexSourcePointer, NULL);
	glCompileShader(VertexShaderID);

	// Check Vertex Shader
	glGetShaderiv(VertexShaderID, GL_COMPILE_STATUS, &Result);
	glGetShaderiv(VertexShaderID, GL_INFO_LOG_LENGTH, &InfoLogLength);
	if (InfoLogLength > 0){
		std::vector<char> VertexShaderErrorMessage(InfoLogLength + 1);
		glGetShaderInfoLog(VertexShaderID, InfoLogLength, NULL, &VertexShaderErrorMessage[0]);
		printf("%s\n", &VertexShaderErrorMessage[0]);
	}



	// Compile Fragment Shader
	printf("Compiling shader : %s\n", fragment_file_path);
	char const * FragmentSourcePointer = FragmentShaderCode.c_str();
	glShaderSource(FragmentShaderID, 1, &FragmentSourcePointer, NULL);
	glCompileShader(FragmentShaderID);

	// Check Fragment Shader
	glGetShaderiv(FragmentShaderID, GL_COMPILE_STATUS, &Result);
	glGetShaderiv(FragmentShaderID, GL_INFO_LOG_LENGTH, &InfoLogLength);
	if (InfoLogLength > 0){
		std::vector<char> FragmentShaderErrorMessage(InfoLogLength + 1);
		glGetShaderInfoLog(FragmentShaderID, InfoLogLength, NULL, &FragmentShaderErrorMessage[0]);
		printf("%s\n", &FragmentShaderErrorMessage[0]);
	}



	// Link the program
	printf("Linking program\n");
	GLuint ProgramID = glCreateProgram();
	glAttachShader(ProgramID, VertexShaderID);
	glAttachShader(ProgramID, FragmentShaderID);
	glLinkProgram(ProgramID);

	// Check the program
	glGetProgramiv(ProgramID, GL_LINK_STATUS, &Result);
	glGetProgramiv(ProgramID, GL_INFO_LOG_LENGTH, &InfoLogLength);
	if (InfoLogLength > 0){
		std::vector<char> ProgramErrorMessage(InfoLogLength + 1);
		glGetProgramInfoLog(ProgramID, InfoLogLength, NULL, &ProgramErrorMessage[0]);
		printf("%s\n", &ProgramErrorMessage[0]);
	}

	glDeleteShader(VertexShaderID);
	glDeleteShader(FragmentShaderID);

	return ProgramID;
}


float xIncreasing[] = { 0.266f,0.238f,0.21f,0.182f,0.154f,0.126f,0.098f,0.07f,0.042f,0.014f };
float xDecreasing[] = { 0.014f, 0.042f, 0.07f, 0.098f, 0.126f, 0.154f, 0.182f, 0.21f, 0.238f, 0.266f };
float yDecreasing[] = { -0.34f, -0.22f, -0.1f, 0.02f, 0.14f, 0.26f, 0.38f, 0.5f, 0.62f, 0.74f };
float yIncreasing[] = { 0.74f, 0.62f, 0.5f, 0.38f, 0.26f, 0.14f, 0.02f, -0.1f, -0.22f, -0.34f };


//float xIncreasing[] = { 0.112f, 0.168f, 0.28f, 0.28f, 0.14f, 0.112f, 0.098f, 0.07f, 0.07f, 0.07f };
//float xDecreasing[] = { 0.07f, 0.07f, 0.07f, 0.098f, 0.112f, 0.14f, 0.28f, 0.28f, 0.168f, 0.112f };
//float yDecreasing[] = { -0.576f, -0.624f, -0.4f, 0.4f, 0.5f, 0.544f, 0.581f, 0.475f, 0.525f, 0.575f };
//float yIncreasing[] = { 0.575f, 0.525f, 0.475f, -0.581f, 0.544f, 0.5f, 0.4f, -0.4f, -0.624f, -0.576f };

/**
* Program initialization.
*/
void init(ShaderInfo& info, std::unordered_map<std::string, Object> &gameObjs) {


	glGenVertexArrays(1, &info.vertexArray);
	glBindVertexArray(info.vertexArray);

	// create and compile our GLSL program from the shaders
	info.programId = LoadShaders("shaders/vs.glsl", "shaders/fs.glsl");
	Object object;
	for (auto it = gameObjs.begin(); it != gameObjs.end(); ++it)
	{

		object = it->second;
		size_t i = 0;
		int t;
		for (i = 0; i < object.shapes.size(); i++)
		{

			glGenBuffers(1, &object.vertexBuffer[i]);
			glBindBuffer(GL_ARRAY_BUFFER, object.vertexBuffer[i]);
			glBufferData(GL_ARRAY_BUFFER, sizeof(float)*object.shapes[i].mesh.positions.size(), &object.shapes[i].mesh.positions[0], GL_STATIC_DRAW);

			glGenBuffers(1, &object.indexBuffer[i]);
			glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, object.indexBuffer[i]);
			glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(unsigned int)*object.shapes[i].mesh.indices.size(), &object.shapes[i].mesh.indices[0], GL_STATIC_DRAW);

			glGenBuffers(1, &object.vNormalBuffer[i]);
			glBindBuffer(GL_ARRAY_BUFFER, object.vNormalBuffer[i]);
			glBufferData(GL_ARRAY_BUFFER, sizeof(float)*object.shapes[i].mesh.normals.size(), &object.shapes[i].mesh.normals[0], GL_STATIC_DRAW);

			if (object.getTextureIndex(i) != -1)
			{
				glGenBuffers(1, &object.vTextureBuffer[i]);
				glBindBuffer(GL_ARRAY_BUFFER, object.vTextureBuffer[i]);
				glBufferData(GL_ARRAY_BUFFER, sizeof(float)*object.shapes[i].mesh.texcoords.size(), &object.shapes[i].mesh.texcoords[0], GL_STATIC_DRAW);

				glGenTextures(1, &object.texImageBuffer[i]);


				glBindTexture(GL_TEXTURE_2D, object.texImageBuffer[i]);

				t = object.getTextureIndex(i);
				glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, object.objectTextureData[t].imageWidth, object.objectTextureData[t].imageHeight, 0, GL_RGB, GL_UNSIGNED_BYTE, object.objectTextureData[t].textureImage);
				//SOIL_free_image_data(object.objectTextureData[t].textureImage);
				// Nice trilinear filtering.
				glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
				glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
				glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
				glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
				//glGenerateMipmap(GL_TEXTURE_2D);
			}

		}
	}
	//Load the font image required for text rendering
	unsigned char *textImage;
	int width, height;
	textImage = SOIL_load_image("obj/text.bmp", &width, &height, 0, SOIL_LOAD_RGB);
	glGenTextures(1, &textTexture);


	glBindTexture(GL_TEXTURE_2D, textTexture);

	glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB,width,height, 0, GL_RGB, GL_UNSIGNED_BYTE, textImage);
	SOIL_free_image_data(textImage);
	// Nice trilinear filtering.
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

}
int up[] = { 0, 2, 5, 9, 14, 20, 27};
int leftFall[] ={ 0, 1, 3, 6, 10, 15, 21};
std::set<int> fallPosUp(up,up+7);
std::set<int> fallPosLeft(leftFall,leftFall+7);
std::set<int>::iterator it;


bool isValidMove(unsigned int position, int dir)
{

	switch (dir)
	{

	case 0:// DOWN
	case 2://RIGHT
		if (position > 27)
			return false;
		else
			return true;
		break;
	case 1:// UP
		it = fallPosUp.find(position);
		if (it != fallPosUp.end())
			return false;
		else
			return true;
		break;
	case 3:// LEFT
		it = fallPosLeft.find(position);
		if (it != fallPosLeft.end())
			return false;
		else
			return true;
		break;


	}
	return false;
}


void key_callback(GLFWwindow* window, int key, int scancode, int action, int mode)
{
	// When a user presses the escape key, we set the WindowShouldClose property to true, 
	// closing the application
	if ((key == GLFW_KEY_ESCAPE || key == GLFW_KEY_Q )&& (action == GLFW_PRESS || action == GLFW_REPEAT))
		glfwSetWindowShouldClose(window, GL_TRUE);
	if (updated){
		
		if (key == GLFW_KEY_DOWN && (action == GLFW_PRESS))
		{
			qbertPosition.direction = 0;
			updated = false;
		}

		if (key == GLFW_KEY_UP && (action == GLFW_PRESS))
		{
			qbertPosition.direction = 1;
			
			updated = false;
		}

		if (key == GLFW_KEY_RIGHT && (action == GLFW_PRESS))
		{
			qbertPosition.direction = 2;
			updated = false;
		}

		if (key == GLFW_KEY_LEFT && (action == GLFW_PRESS))
		{
			qbertPosition.direction = 3;
			updated = false;
		}
	}
	if (key == GLFW_KEY_R && (action == GLFW_PRESS))
	{
		//Add code to reset whole game;
		game_finished = false;
		reset_game = true;
		qbertKilled = 0;
		lives = 2;
		materialIndex[0] = 1;
	}
	if (key == GLFW_KEY_P && (action == GLFW_PRESS))
	{
		perspective = !perspective;
	}
	if (key == GLFW_KEY_ENTER && (action == GLFW_PRESS))
	{
		if (level_complete || qbertKilled > 0)reset_game = true;
	}
	if (action == GLFW_PRESS)
	{
		std::cout << "SCORE  =  " << score << "-----> Current Position  " << qbertPosition.boardPosition << endl;
		std::cout << "start   "<< start << "   duration  =  " << duration << endl;

	}
}

void moveHaunter(Object &haunter)
{

	if (haunterPosition.counter == 0)
	{
		haunterPosition.direction = (rand()) % 2;
	
	}
	if (haunterPosition.counter == 10)
	{
		haunterUpdated = true;
		haunterPosition.setValues(0.0, 0.0, 0.0, haunterPosition.angle);
		haunterPosition.counter = 0;
		
		if (haunterPosition.boardPosition > 27)
		{
			haunter.initializeObjectTransform(-1.4f, 68.0f, 101.4f, 0.015f, 0.015f, 0.015f, -45.0f);
			haunterPosition.setPosition(1, 1, 0);
			counter = 0;
			haunterUpdated = false;
			sphereUpdated = false;
			spherePosition.render = true;
			haunterPosition.render = true;
		}
		return;
	}
	switch (haunterPosition.direction)
	{
	case 0:
		haunterPosition.setValues(-xDecreasing[haunterPosition.counter], -yDecreasing[haunterPosition.counter], xIncreasing[haunterPosition.counter], -45.0f);
		if (haunterPosition.counter == 9)
		{
			haunterPosition.boardPosition += (haunterPosition.currentRow + 1);
			haunterPosition.currentRow++;
		}
		haunterPosition.counter++;
		break;
	case 1:
		haunterPosition.setValues(xIncreasing[haunterPosition.counter], -yDecreasing[haunterPosition.counter], xIncreasing[haunterPosition.counter], 45.0f);
		if (haunterPosition.counter == 9)
		{
			haunterPosition.boardPosition += (haunterPosition.currentRow + 2);
			haunterPosition.currentRow++;
		}
		haunterPosition.counter++;
		break;

	}
	haunterUpdated = false;

}
void moveSphere(Object &sphere)
{
	
	if (spherePosition.counter == 10)
	{
		spherePosition.counter = 0;
		sphereUpdated = true;
		spherePosition.setValues(0.0f,0.0f,0.0f,spherePosition.angle);
		if (spherePosition.boardPosition > 27)
		{
			sphere.initializeObjectTransform(-1.4f, 68.0f, 101.4f, 0.015f, 0.015f, 0.015f, -45.0f);
			spherePosition.setPosition(1, 1, 0);
			spherePosition.setValues(0.0, 0.0, 0.0, -45.0);
			spherePosition.render = false;
		}
		return;
	}
	spherePosition.setValues(-xDecreasing[spherePosition.counter], -yDecreasing[spherePosition.counter], xIncreasing[spherePosition.counter], -45.0f);
	
	sphereUpdated = false;
	if (spherePosition.counter == 9)
	{
		spherePosition.boardPosition += (spherePosition.currentRow + 1);
		spherePosition.currentRow++;
	}
	spherePosition.counter++;
	
}
bool coilyUpdated = false;
void moveCoily(Object &coily)
{
	if (coilyPosition.counter == 10)
	{
		coilyPosition.counter = 0;
		coilyPosition.setValues(0.0f, 0.0f, 0.0f, coilyPosition.angle);
		coilyUpdated = true;
		return;
	}
	if (coilyPosition.counter == 0)
	{
		unsigned int tempPos = 0;
		vector<unsigned int> validValues;


		for (size_t i = 0; i < 4; i++)
		{

			if (i == 0)
				tempPos = coilyPosition.boardPosition + (coilyPosition.currentRow + 1);
			else if (i == 2)
				tempPos = coilyPosition.boardPosition + (coilyPosition.currentRow + 2);
			else
				tempPos = coilyPosition.boardPosition;

			if (isValidMove(tempPos, i))
				validValues.push_back(i);

		}

		coilyPosition.direction = validValues[(rand()) % validValues.size()];
	}
	switch (coilyPosition.direction)
	{
	case 0:
		coilyPosition.setValues(-xDecreasing[coilyPosition.counter], -yDecreasing[coilyPosition.counter], xIncreasing[coilyPosition.counter],-45.0f);
		
		if (coilyPosition.counter == 9)
		{
			coilyPosition.boardPosition += (coilyPosition.currentRow + 1);
			coilyPosition.currentRow++;
		}
		coilyPosition.counter++;
		break;
	case 1:
		coilyPosition.setValues(xIncreasing[coilyPosition.counter], yIncreasing[coilyPosition.counter], -xDecreasing[coilyPosition.counter], 135.0f);

		if (coilyPosition.counter == 9)
		{
			coilyPosition.boardPosition -= (coilyPosition.currentRow);
			coilyPosition.currentRow--;
		}
		coilyPosition.counter++;
		break;
	case 2:
		coilyPosition.setValues(xIncreasing[coilyPosition.counter], -yDecreasing[coilyPosition.counter], xIncreasing[coilyPosition.counter], 45.0f);

		if (coilyPosition.counter == 9)
		{
			coilyPosition.boardPosition += (coilyPosition.currentRow + 2);
			coilyPosition.currentRow++;
		}
		coilyPosition.counter++;
		break;
	case 3:
		coilyPosition.setValues(-xDecreasing[coilyPosition.counter], yIncreasing[coilyPosition.counter], -xDecreasing[coilyPosition.counter], -135.0f);

		if (coilyPosition.counter == 9)
		{
			coilyPosition.boardPosition -= (coilyPosition.currentRow + 1);
			coilyPosition.currentRow--;
		}
		coilyPosition.counter++;
		break;
	}
	coilyUpdated = false;
}
void moveQbert(){
	
	if (qbertPosition.counter == 10)
	{
		qbertPosition.setValues(0.0f, 0.0f, 0.0f, qbertPosition.angle);
		if (game_started)
			position_covered[qbertPosition.boardPosition] = true;
		updated = true;
		qbertPosition.counter = 0;
		return;
	}

	switch (qbertPosition.direction)
	{
	case 0: 
		

		qbertPosition.setValues(-xDecreasing[qbertPosition.counter], -yDecreasing[qbertPosition.counter], xIncreasing[qbertPosition.counter], -45.0f);
		
		if (qbertPosition.counter == 9)
		{
			qbertPosition.boardPosition += (qbertPosition.currentRow + 1);
			if (!isValidMove(qbertPosition.boardPosition, 0))
			{
				qbertKilled = 1;
				sound_played = false;
				soundIndex = 1;
				return;
			}
			qbertPosition.currentRow++;
			game_started = true;
			sound_played = false;
			soundIndex = 0;
			
		}
		qbertPosition.counter++;
		updated = false;
		break;
	case 1:
		qbertPosition.setValues(xIncreasing[qbertPosition.counter], yIncreasing[qbertPosition.counter], -xDecreasing[qbertPosition.counter], 135.0f);

		if (qbertPosition.counter == 9)
		{
			if (qbertPosition.boardPosition == 14)
			{
				reset_QBERT = true;
				return;
			}
			if (!isValidMove(qbertPosition.boardPosition, 1))
			{
				qbertKilled = 1;
				sound_played = false;
				soundIndex = 1;
				return;
			}
			qbertPosition.boardPosition -= (qbertPosition.currentRow);
			
			qbertPosition.currentRow--;
			game_started = true;
			sound_played = false;
			soundIndex = 0;
		}
		qbertPosition.counter++;
		updated = false;
		break;
	case 2:
		qbertPosition.setValues(xIncreasing[qbertPosition.counter], -yDecreasing[qbertPosition.counter], xIncreasing[qbertPosition.counter], 45.0f);

		if (qbertPosition.counter == 9)
		{
			qbertPosition.boardPosition += (qbertPosition.currentRow + 2);
			if (!isValidMove(qbertPosition.boardPosition, 2))
			{
				qbertKilled = 1;
				sound_played = false;
				soundIndex = 1;
				return;
			}
			
			qbertPosition.currentRow++;
			game_started = true;
			sound_played = false;
			soundIndex = 0;

		}
		qbertPosition.counter++;
		updated = false;
		break;
	case 3:
		qbertPosition.setValues(-xDecreasing[qbertPosition.counter], yIncreasing[qbertPosition.counter], -xDecreasing[qbertPosition.counter], -135.0f);

		if (qbertPosition.counter == 9)
		{
			if (qbertPosition.boardPosition == 10)
			{
				reset_QBERT = true;
				return;
			}
			if (!isValidMove(qbertPosition.boardPosition, 3))
			{
				qbertKilled = 1;
				sound_played = false;
				soundIndex = 1;
				return;
			}
			qbertPosition.boardPosition -= (qbertPosition.currentRow + 1);
			qbertPosition.currentRow--;
			game_started = true;
			sound_played = false;
			soundIndex = 0;
		}
		qbertPosition.counter++;
		updated = false;
		break;
	default:
		break;
	}
}
// For Y scale ANimation between(0.5-1) *(0.75 + sin(duration*2)*0.25)
void render(ShaderInfo &info, Object &object)
{

		 float rotateFactor = 0.0f;
		 duration = (std::clock() - start) / (double)CLOCKS_PER_SEC;
		 glm::mat4 projectionMatrix = glm::perspective(glm::radians(45.0f), 4.0f / 3.0f, 0.1f, 100.0f);
		 glm::mat4 viewMatrix = glm::lookAt(glm::vec3(0, 12, 20), glm::vec3(0, 0, 0), glm::vec3(0, 1, 0));
		 if (!perspective)
		 {
			 projectionMatrix = glm::ortho(-0.3f, 0.3f, -0.3f, 0.3f, 0.1f, 100.0f);
		 }
		 // Or, for an ortho camera :
		 //glm::mat4 Projection = glm::ortho(-10.0f,10.0f,-10.0f,10.0f,0.0f,100.0f); // In world coordinates
		
		 // LookAt matrix
		 glm::mat4 viewScaled = glm::scale(glm::mat4(1.0f), glm::vec3(object.objectTransform.objScale[0] + transition_scale, object.objectTransform.objScale[1] + transition_scale, object.objectTransform.objScale[2] + transition_scale));
		 glm::mat4 translateMatrix = glm::translate(viewScaled, glm::vec3(object.objectTransform.objTranslate[0], object.objectTransform.objTranslate[1], object.objectTransform.objTranslate[2]));
		 glm::mat4 rotateMatrix = glm::rotate(translateMatrix, transition_rotation, glm::vec3(0, 0, 1));
		 glm::mat4 modelMatrix = glm::rotate(rotateMatrix, object.objectTransform.rotationAngle, glm::vec3(0, 1, 0));
		 

		 //glm::mat4 modelMatrix = glm::mat4(1.0f);
		 //glm::translate(modelMatrix, glm::vec3(-0.5f, -0.5f, 1.0f));
		 
		 glm::mat4 mvpMatrix = projectionMatrix * viewMatrix * modelMatrix; 
		
		 glm :: mat4 mvMatrix = viewMatrix * modelMatrix;
		 glm :: mat4 normalMatrix = glm::transpose(glm::inverse(mvMatrix));
		  
	// Use our shader


	//MaterialData mMaterialInfo;
	GLuint mvpUniform = glGetUniformLocation(info.programId, "mvpMatrix");
	GLuint mvUniform = glGetUniformLocation(info.programId, "mvMatrix");
	GLuint normalMatUniform = glGetUniformLocation(info.programId, "uNMatrix");
	GLuint ambientUniform = glGetUniformLocation(info.programId, "materialInfo.uAmbientVal");
	GLuint diffuseUniform = glGetUniformLocation(info.programId, "materialInfo.uDiffuseVal");
	GLuint specularUniform = glGetUniformLocation(info.programId, "materialInfo.uSpecularVal");
	GLuint shininessUniform = glGetUniformLocation(info.programId, "materialInfo.shininess");
	GLuint textureID  = glGetUniformLocation(info.programId, "uSampler");
	
	glm::vec3 tempVec;
#ifdef DEBUG
	if (mvpUniform == -1)
	{
		std::cout << "Problem with mvpUniform in shader" << endl;
	}
	
	if (mvUniform == -1)
	{
		std::cout << "Problem with mvUniform in shader" << endl;
	}
	
	if (normalMatUniform == -1)
	{
		std::cout << "Problem with normalMatUniform in shader" << endl;
	}
	
	if (ambientUniform == -1)
	{
		std::cout << "Problem with ambientUniform in shader" << endl;
	}
	
	if (diffuseUniform == -1)
	{
		std::cout << "Problem with diffuseUniform in shader" << endl;
	}
	
	if (specularUniform == -1)
	{
		std::cout << "Problem with specularUniform in shader" << endl;
	}
	
	if (shininessUniform == -1)
	{
		std::cout << "Problem with shininessUniform in shader" << endl;
	}
#endif
	glm::vec3 myColor = glm::vec3(0.3, 0.0,0.0);
	glUniformMatrix4fv(mvpUniform, 1, GL_FALSE, &mvpMatrix[0][0]);
	glUniformMatrix4fv(mvUniform, 1, GL_FALSE, &mvMatrix[0][0]);
	glUniformMatrix4fv(normalMatUniform, 1, GL_FALSE, &normalMatrix[0][0]);
	size_t i = 0;
	
	for (; i < object.shapes.size(); i++)
	{

		
		glUniform3fv(ambientUniform, 1, &object.materials[object.shapes[i].mesh.material_ids[0]].ambient[0]);
		glUniform3fv(diffuseUniform, 1, &object.materials[object.shapes[i].mesh.material_ids[0]].diffuse[0]);
		glUniform3fv(specularUniform, 1, &object.materials[object.shapes[i].mesh.material_ids[0]].specular[0]);
		glUniform1f(shininessUniform,object.materials[object.shapes[i].mesh.material_ids[0]].shininess);

		

	// 1rst attribute buffer : vertices
	glEnableVertexAttribArray(0);
	glEnableVertexAttribArray(1);
	glEnableVertexAttribArray(2);
	//Send vertex Data
	glBindBuffer(GL_ARRAY_BUFFER, object.vertexBuffer[i]);
	glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 0, (void*)0);
	//Send vertex normal Data
	glBindBuffer(GL_ARRAY_BUFFER, object.vNormalBuffer[i]);
	glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 0, (void*)0);
	glUniform1i(glGetUniformLocation(info.programId, "isText"), 0);
	if (object.getTextureIndex(i) != -1)
	{
		//Send vertex texture Data
		glBindBuffer(GL_ARRAY_BUFFER, object.vTextureBuffer[i]);
		glVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE, 0, (void*)0);
	
		glActiveTexture(GL_TEXTURE0);
		glBindTexture(GL_TEXTURE_2D, object.texImageBuffer[i]);
		glUniform1i(textureID, 0);
		glUniform1i(glGetUniformLocation(info.programId,"textureEnabled"), 1);
	}
	else
	{
		glUniform1i(glGetUniformLocation(info.programId, "textureEnabled"), 0);
		glDisableVertexAttribArray(2);
	}
	// Draw the triangle !
	//Send vertex index Data
	glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, object.indexBuffer[i]);
	glDrawElements(GL_TRIANGLES, object.shapes[i].mesh.indices.size(), GL_UNSIGNED_INT, 0); // Starting from vertex 0; 3 vertices total -> 1 triangle
	//glDrawArrays(GL_TRIANGLES, 0, 3);
	glDisableVertexAttribArray(0);
	glDisableVertexAttribArray(1);
	glDisableVertexAttribArray(2);
	//getchar();

	}
}
void generateBoard(ShaderInfo &info, Object newObject)
{

	size_t height = 1;
	float moveX = 2.80f;
	float moveY = -2.0f;
	float moveZ = 1.4f;
	unsigned int count = 0;
	score = 0;
	for(size_t t = 0; t < height; t++)
	{
		if (!level_complete)
		{
			if (position_covered[count] == true)
			{
				newObject.shapes[1].mesh.material_ids[0] = materialIndex[1];
				score +=25;
				if (score / 25 == 28)
					level_complete = true;
			
			}
			else
			{
				newObject.shapes[1].mesh.material_ids[0] = materialIndex[0];
			}
		}
		else
		{
		
			score = 25 * 28;
		}
		render(info, newObject);
		newObject.objectTransform.objTranslate[0] += moveX;
		count++;
		if (t == height-1 && t != 6)
		{
			newObject.objectTransform.objTranslate[1] += moveY;
			newObject.objectTransform.objTranslate[2] += moveZ;
			
			newObject.objectTransform.objTranslate[0] -= (t+1)*moveX + moveX/2;
			height++;
			t = -1;
		}
		
	}
	
	
}
void blinkBoard(ShaderInfo &info, Object cube){
	
	cube.shapes[1].mesh.material_ids[0] = materialIndex[(counter%2)];
	generateBoard(info, cube);
}
void renderText(ShaderInfo &info, std::string text, float x, float y)
{
	float uv_x = 0.0f;
	float uv_y = 0.0f;
	float fontsize = 0.06f;
	//text = "SCORE";
	vector<float> textVertices;
	vector<float> textTextures;
	GLuint vertexBuffer;
	GLuint textureBuffer;
	//textVertices.push_back(0.0f);
	//textVertices.push_back(0.0f);
	//textVertices.push_back(0.5f);
	//textVertices.push_back(0.5f);
	//textVertices.push_back(0.0f);
	//textVertices.push_back(0.5f);
	//
	//textTextures.push_back(0.0f);
	//textTextures.push_back(0.0f);
	//textTextures.push_back(0.0f);
	//textTextures.push_back(0.0f);
	//textTextures.push_back(0.0f);
	//textTextures.push_back(0.0f);
	for (size_t i = 0; i < text.length(); i++)
	{
		textVertices.push_back(x + (i*fontsize));
		textVertices.push_back(y + (fontsize));

		textVertices.push_back(x + (i*fontsize));
		textVertices.push_back(y);

		textVertices.push_back(x + (i*fontsize) + fontsize);
		textVertices.push_back(y + (fontsize));

		textVertices.push_back(x + (i*fontsize) + fontsize);
		textVertices.push_back(y);

		textVertices.push_back(x + (i*fontsize) + fontsize);
		textVertices.push_back(y + (fontsize));

		textVertices.push_back(x + (i*fontsize));
		textVertices.push_back(y);

		unsigned int ch = (unsigned int)text.at(i);
		uv_x = (ch % 16) / 16.0f;
		uv_y = floor(ch / 16.0f) / 16.0f;

		textTextures.push_back(uv_x);
		textTextures.push_back(uv_y);

		textTextures.push_back(uv_x);
		textTextures.push_back((uv_y + 1.0f / 16.0f));

		textTextures.push_back(uv_x + 1.0f / 16.0f);
		textTextures.push_back(uv_y);

		textTextures.push_back(uv_x + 1.0f / 16.0f);
		textTextures.push_back((uv_y + 1.0f / 16.0f));

		textTextures.push_back(uv_x + 1.0f / 16.0f);
		textTextures.push_back(uv_y);

		textTextures.push_back(uv_x);
		textTextures.push_back((uv_y + 1.0f / 16.0f));

	}
	
	glGenBuffers(1, &vertexBuffer);
	glBindBuffer(GL_ARRAY_BUFFER, vertexBuffer);
	glBufferData(GL_ARRAY_BUFFER, sizeof(float)*textVertices.size(), &textVertices[0], GL_STATIC_DRAW);

	glGenBuffers(1, &textureBuffer);
	glBindBuffer(GL_ARRAY_BUFFER, textureBuffer);
	glBufferData(GL_ARRAY_BUFFER, sizeof(float)*textTextures.size(), &textTextures[0], GL_STATIC_DRAW);

	glEnableVertexAttribArray(3);
	glEnableVertexAttribArray(4);

	glUniform1i(glGetUniformLocation(info.programId, "isText"), 1);
	if (glGetUniformLocation(info.programId, "isText") == -1)
	{
		cout << "ERROR";
		getchar();
		exit(0);
	}
	//Send vertex texture Data
	glBindBuffer(GL_ARRAY_BUFFER, vertexBuffer);
	glVertexAttribPointer(3, 2, GL_FLOAT, GL_FALSE, 0, (void*)0);

	//Send vertex texture Data
	glBindBuffer(GL_ARRAY_BUFFER, textureBuffer);
	glVertexAttribPointer(4, 2, GL_FLOAT, GL_FALSE, 0, (void*)0);

	glActiveTexture(GL_TEXTURE0);
	glBindTexture(GL_TEXTURE_2D, textTexture);
	glUniform1i(glGetUniformLocation(info.programId,"uSampler"), 0);
		
	glDrawArrays(GL_TRIANGLES, 0, textVertices.size() / 2);
	glDisableVertexAttribArray(3);
	glDisableVertexAttribArray(4);

}
void addDisc(ShaderInfo &info, Object newObject)
{
	newObject.objectTransform.rotationAngle = disc_rotation;
	render(info, newObject);
	newObject.objectTransform.objTranslate[0] += 14;
	render(info, newObject);
	disc_rotation += 2.0f;
	if (disc_rotation == 360.0f) disc_rotation = 0.0f;

}
void showLives(ShaderInfo &info, Object qbert)
{
	if (lives <= 0)
		return;
	qbert.initializeObjectTransform(-18.0f, 70.0f, 100.0f, 0.01f, 0.01f, 0.01f, 0.0f);
	for (size_t i = 0; i < lives; i++)
	{
		render(info, qbert);
		qbert.objectTransform.objTranslate[1] += 3.0f;
	}

}
void checkCollision(int check)
{
	if (!updated || qbertKilled == 2)
		return;
	switch (check)
	{
	case 0:
		if (qbertPosition.boardPosition == spherePosition.boardPosition)
		{
			qbertKilled = 2;
		}
		break;
	case 1:
		if (qbertPosition.boardPosition == haunterPosition.boardPosition)
		{
			qbertKilled = 2;
		}
		break;
	case 2:
		if (qbertPosition.boardPosition == coilyPosition.boardPosition)
		{
			qbertKilled = 2;
		}
		break;
	
	}
	
	if (qbertKilled == 2)
	{
		sound_played = false;
		soundIndex = 2;
	}

}
void loadAllGameObjects(std::unordered_map<std::string, Object> &gameObjs){

	std::string objFile = "obj/cube.obj";
	std::string mtlFile = "obj/";
	//Adding cube object[Basic unit for generating board]
	Object cubeObject(objFile, mtlFile);
	cubeObject.initializeObjectTransform(0.0f, 68.0f, 100.0f, scale, scale, scale, 45.0f);
	gameObjs.insert(std::pair<std::string, Object>("cube", cubeObject));

	objFile = "obj/qbot.obj";
	mtlFile = "obj/";
	//Adding Qbert Character
	Object qbert(objFile, mtlFile);
	qbert.initializeObjectTransform(0.0f, 70.0f, 100.0f, scale, scale, scale, -45.0f);
	gameObjs.insert(std::pair<std::string, Object>("qbert", qbert));
	qbertPosition.setPosition(0, 0, 0);
	qbertPosition.setValues(0.0, 0.0, 0.0, -45.0);


	objFile = "obj/coily.obj";
	mtlFile = "obj/";
	Object coily(objFile, mtlFile);
	coily.initializeObjectTransform(8.4f, 58.0f, 108.4f, scale, scale, scale, -45.0f);
	gameObjs.insert(std::pair<std::string, Object>("coily", coily));
	coilyPosition.setPosition(6, 27, 0);
	coilyPosition.setValues(0.0, 0.0, 0.0, -45.0);

	objFile = "obj/Gastly.obj";
	mtlFile = "obj/";
	Object sphere(objFile, mtlFile);
	sphere.initializeObjectTransform(-1.4f, 68.0f, 101.4f, scale, scale, scale, -45.0f);
	gameObjs.insert(std::pair<std::string, Object>("sphere", sphere));
	spherePosition.setPosition(1, 1, 0);
	spherePosition.setValues(0.0, 0.0, 0.0, -45.0);

	objFile = "obj/Haunter.obj";
	mtlFile = "obj/";
	Object haunter(objFile, mtlFile);
	haunter.initializeObjectTransform(-1.4f, 68.0f, 101.4f, scale, scale, scale, -45.0f);
	gameObjs.insert(std::pair<std::string, Object>("haunter", haunter));
	haunterPosition.setPosition(1, 1, 0);
	haunterPosition.setValues(0.0, 0.0, 0.0, -45.0);

	objFile = "obj/disc.obj";
	mtlFile = "obj/";
	Object disc(objFile, mtlFile);
	disc.initializeObjectTransform(-7.0f, 63.0f, 104.2f, scale, scale, scale, 0.0f);
	gameObjs.insert(std::pair<std::string, Object>("disc", disc));
	//disc.toString();

}

void resetQbert(Object &qbert)
{
	qbert.initializeObjectTransform(0.0f, 70.0f, 100.0f, scale, scale, scale, -45.0f);
	qbertPosition.setPosition(0, 0, 0);
	qbertPosition.setValues(0.0, 0.0, 0.0, -45.0);
	reset_QBERT = false;
	updated = true;
	qbertPosition.counter = 0;
}
void resetCoily(Object &coily)
{

	coily.initializeObjectTransform(8.4f, 58.0f, 108.4f, scale, scale, scale, -45.0f);
	coilyPosition.setPosition(6, 27, 0);
	coilyPosition.setValues(0.0, 0.0, 0.0, -45.0);
	coilyPosition.counter = 0;
	coilyUpdated = true;

}
void resetSphere(Object &sphere)
{
	sphere.initializeObjectTransform(-1.4f, 68.0f, 101.4f, scale, scale, scale, -45.0f);
	spherePosition.setPosition(1, 1, 0);
	spherePosition.setValues(0.0, 0.0, 0.0, -45.0);
	sphereUpdated = true;
	spherePosition.counter = 0;

}
void resetHaunter(Object &haunter)
{
	haunter.initializeObjectTransform(-1.4f, 68.0f, 101.4f, scale, scale, scale, -45.0f);
	haunterPosition.setPosition(1, 1, 0);
	haunterPosition.setValues(0.0, 0.0, 0.0, -45.0);
	haunterUpdated = true;
	haunterPosition.counter = 0;
}

void resetGame(ShaderInfo &info, std::unordered_map<std::string, Object> &gameObjs){


	game_started = false;
	level_complete = false;
	counter = 0;
	std::unordered_map<std::string, Object>::iterator res;
	if (qbertKilled < 2)
	{

		
		if (qbertKilled == 0)
		{

			for (size_t i = 0; i < 28; i++)
			{
				position_covered[i] = false;
			}

			if (materialIndex[0] < 4)
			{
				materialIndex[0]++;
			}
			else
			{
				std::string text = "GAME OVER";
				renderText(info, text, -0.4f, 0.0f);
				game_finished = true;
			}

			level_animating = true;
			transition_rotation = 180.0f;
		}

		res = gameObjs.find("qbert");
		if (res == gameObjs.end())
		{
			std::cout << "Qbert object is not present in map" << endl;
			getchar(); exit(0);
		}
		else
		{
			resetQbert(res->second);
	
		}
	}

	if (qbertKilled != 0)
	{
		lives--;
		qbertKilled = 0;
		if (lives < 0)
		{
			std::string text = "GAME OVER";
			renderText(info, text, -0.4f, 0.0f);
			game_finished = true;
		}
			
	}
	res = gameObjs.find("coily");
	if (res == gameObjs.end())
	{
		std::cout << "Qbert object is not present in map" << endl;
		getchar(); exit(0);
	}
	else
	{
		resetCoily(res->second);

	}

	res = gameObjs.find("sphere");
	if (res == gameObjs.end())
	{
		std::cout << "Qbert object is not present in map" << endl;
		getchar(); exit(0);
	}
	else
	{
		resetSphere(res->second);

	}

	res = gameObjs.find("haunter");
	if (res == gameObjs.end())
	{
		std::cout << "Qbert object is not present in map" << endl;
		getchar(); exit(0);
	}
	else
	{
		resetHaunter(res->second);

	}
	

}
bool updateCreatures = false;
void gameLoop(ShaderInfo &info, std::unordered_map<std::string, Object> &gameObjs)
{
	duration = (std::clock() - start) / (double)CLOCKS_PER_SEC;
	double sinVal = sin(90.0f * duration);
	// GENERATE BOARD
	std::unordered_map<std::string, Object>::iterator res = gameObjs.find("cube");
	if (res == gameObjs.end())
	{
		std::cout << "Cube object is not present in map" << endl;
		getchar();
		exit(0);
	}
	if (!level_complete)
		generateBoard(info, res->second);
	else
		blinkBoard(info, res->second);

	res = gameObjs.find("disc");
	if (res == gameObjs.end())
	{
		std::cout << "disc object is not present in map" << endl;
		getchar();
		exit(0);
	}
	addDisc(info, res->second);

	if (level_animating)
	{
		if (duration > 0.05)
		{
			
			transition_rotation -= 18.0f;
			transition_scale = scale*0.1f*sin(transition_rotation *2 / 3);
			start = std::clock();
		}
		if (transition_rotation == 0) level_animating = false;
		return;
	}
	

		res = gameObjs.find("qbert");
		if (res == gameObjs.end())
		{
			std::cout << "Qbert object is not present in map" << endl;
			getchar(); exit(0);
		}
		else if (qbertKilled == 0 && updateCreatures)
		{
			if (reset_QBERT)
			{
				resetQbert(res->second);
			}
			if (!updated)
			{
				moveQbert();
				res->second.objectTransform.objTranslate[0] += qbertPosition.translate[0];
				res->second.objectTransform.objTranslate[1] += qbertPosition.translate[1];
				res->second.objectTransform.objTranslate[2] += qbertPosition.translate[2];
				res->second.objectTransform.rotationAngle = qbertPosition.angle;
			}

		}

		if (qbertPosition.render)
			render(info, res->second);
		
		showLives(info, res->second);
		
		
		if (game_started && counter > 20 && spherePosition.render)
		{
			res = gameObjs.find("sphere");

			if (res == gameObjs.end())
			{
				std::cout << "sphere object is not present in map" << endl;
				getchar(); exit(0);
			}
			else if (updateCreatures && qbertKilled == 0 && !sphereUpdated)
			{
				moveSphere(res->second);
				res->second.objectTransform.objTranslate[0] += spherePosition.translate[0];
				res->second.objectTransform.objTranslate[1] += spherePosition.translate[1];
				res->second.objectTransform.objTranslate[2] += spherePosition.translate[2];
				res->second.objectTransform.rotationAngle = spherePosition.angle;
			}
			if (spherePosition.render)
			{
				render(info, res->second);
				checkCollision(0);
			}
		}

		if (game_started && haunterPosition.render && counter > 50)
		{
			res = gameObjs.find("haunter");

			if (res == gameObjs.end())
			{
				std::cout << "haunter object is not present in map" << endl;
				getchar(); exit(0);
			}
			else if (updateCreatures && !haunterUpdated && qbertKilled == 0)
			{
				moveHaunter(res->second);
				res->second.objectTransform.objTranslate[0] += haunterPosition.translate[0];
				res->second.objectTransform.objTranslate[1] += haunterPosition.translate[1];
				res->second.objectTransform.objTranslate[2] += haunterPosition.translate[2];
				res->second.objectTransform.rotationAngle = haunterPosition.angle;
				haunterPosition.setValues(0.0f, 0.0f, 0.0f, haunterPosition.angle);
			}
			if (haunterPosition.render)
			{
				render(info, res->second);
				checkCollision(1);
			}
		}

		if (game_started)
		{
			// RENDER Sphere Object
			res = gameObjs.find("coily");

			if (res == gameObjs.end())
			{
				std::cout << "Coily object is not present in map" << endl;
				getchar(); exit(0);
			}
			else if (updateCreatures&& !coilyUpdated && qbertKilled == 0)
			{
				moveCoily(res->second);
				res->second.objectTransform.objTranslate[0] += coilyPosition.translate[0];
				res->second.objectTransform.objTranslate[1] += coilyPosition.translate[1];
				res->second.objectTransform.objTranslate[2] += coilyPosition.translate[2];
				res->second.objectTransform.rotationAngle = coilyPosition.angle;
			}

			if (coilyPosition.render)
			{
				render(info, res->second);
				checkCollision(2);
			}

		}

		if(duration > 0.03)
		{
			if (qbertKilled == 0)
			{
				counter++;
				updateCreatures = true;
			}
			if (counter % 20==0)
			{
				haunterUpdated = false;
				sphereUpdated = false;
				coilyUpdated = false;
			}
			start = std::clock();
		}
		else
		{
			updateCreatures = false;
		}

		if (reset_game)
		{
			resetGame(info, gameObjs);
			reset_game = false;
		}
		if (level_complete)
		{
			std::string text = "LEVEL COMPLETE";
			renderText(info, text, 0.2f, 0.9f);
				text = "PRESS ENTER TO CONTINUE";
				renderText(info, text, -0.6f, -0.5f);
			updateCreatures = false;
		}
		else
		{
			std::string text = "LEVEL - ";
			text.append(std::to_string((materialIndex[0]-1)));
			renderText(info, text, 0.2f, 0.9f);
			text = "PRESS";
			renderText(info, text, 0.3f, 0.8f);
			text = "R : RESTART";
			renderText(info, text, 0.3f, 0.7f);
			text = "Q : QUIT";
			renderText(info, text, 0.3f, 0.6f);
		}

		if (qbertKilled > 0)
		{
			std::string text = "PRESS ENTER TO CONTINUE";
			renderText(info, text, -0.6f, -0.5f);
		}

	
}


int main(int argc, char** argv) {
	ShaderInfo info;
	
   // initialize GLFW
	if (!glfwInit()) {
		fprintf(stderr, "Failed to initialize GLFW!\n");
		return -1;
	}

	glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
	glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
	glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
	glfwWindowHint(GLFW_RESIZABLE, GL_FALSE);

	// open a window and create its OpenGL context
	window = glfwCreateWindow(800, 600, "Khul Ja Sim Sim", nullptr, nullptr);
	if (window == nullptr)
	{
		cout << "Failed to create GLFW window" << std::endl;
		glfwTerminate();
		return -1;
	}
	glfwMakeContextCurrent(window);


	
	glewExperimental = GL_TRUE;
	if (glewInit() != GLEW_OK)
	{
		cerr << "Failed to initialize GLEW" << std::endl;
		return -1;
	}


	initAudioSetttings();
	// load shaders and bind arrays
	info.programId = NULL; 	info.vertexArray = NULL; 	
	std::unordered_map<std::string, Object> gameObjectMap;
	


	loadAllGameObjects(gameObjectMap);
	//std::string objFile = "obj/cube.obj";
	//std::string mtlFile = "obj/";

	////Adding cube object[Basic unit for generating board]
	//Object cubeObject(objFile, mtlFile);
	//cubeObject.initializeObjectTransform(0.0f, 50.0f, -50.0f, 0.002f, 0.002f, 0.002f, 45.0f);
	int shapeCount = 0;
	for (auto it = gameObjectMap.begin(); it != gameObjectMap.end(); ++it)
	{
		shapeCount = it->second.shapes.size();
		//Create Bufffers
		it->second.vertexBuffer = new GLuint[shapeCount];
		it->second.indexBuffer = new GLuint[shapeCount];
		it->second.vNormalBuffer = new GLuint[shapeCount];
		it->second.vTextureBuffer = new GLuint[shapeCount];
		it->second.texImageBuffer = new GLuint[shapeCount];
	}



	//Initialize buffers
	init(info, gameObjectMap);
	
	glEnable(GL_DEPTH_TEST);
	glDepthFunc(GL_LESS); 
	glViewport(0, 0, 800, 600);
	glClearColor(0.f, 0.f, 0.f, 0.f);
	glfwSetKeyCallback(window, key_callback);
	
	start = std::clock();
	while (glfwWindowShouldClose(window) == 0)
	{
		glfwPollEvents();
		if (!game_finished)
		{
			glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
			glUseProgram(info.programId);
			gameLoop(info, gameObjectMap);
			std::string text = "SCORE = ";
			text.append(std::to_string(score));
			renderText(info, text, -0.9f, 0.9f);
			glfwSwapBuffers(window);

			if (!sound_played && soundIndex >=0)
				playSound(soundIndex);
		}

		//checkCollision();

	}

	
	glfwTerminate();

	return 0;
}

#endif

