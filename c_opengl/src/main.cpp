#include <windows.h>
#include <string>
#include <stdio.h>
#include <stdlib.h>
#include <vector>
#include <fstream>
#include <iostream>
using namespace std;

//#define COMPATIBILITY
#define MODERN

/*********************************************************************************************************************
* OpenGL 3.x+ example.
*********************************************************************************************************************/

#ifdef MODERN

// include GLEW
#include "glew/glew.h"

// include GLFW
#include "glfw/glfw3.h"
GLFWwindow* window;

// include GLM
#include "glm/glm.hpp"
using namespace glm;

struct ShaderInfo {
	GLuint programId;
	GLuint vertexArray;
	GLuint vertexBuffer;
};

/**
* Load and runtime compile GLSL shaders.
*/
GLuint LoadShaders( const char* vertex_file_path, const char* fragment_file_path ){

	// Create the shaders
	GLuint VertexShaderID = glCreateShader( GL_VERTEX_SHADER );
	GLuint FragmentShaderID = glCreateShader( GL_FRAGMENT_SHADER );

	// Read the Vertex Shader code from the file
	std::string VertexShaderCode;
	std::ifstream VertexShaderStream(vertex_file_path, std::ios::in);
	if(VertexShaderStream.is_open()){
		std::string Line = "";
		while(getline(VertexShaderStream, Line))
			VertexShaderCode += "\n" + Line;
		VertexShaderStream.close();
	}else{
		printf("Impossible to open %s. Are you in the right directory ? Don't forget to read the FAQ !\n", vertex_file_path);
		getchar();
		return 0;
	}

	// Read the Fragment Shader code from the file
	std::string FragmentShaderCode;
	std::ifstream FragmentShaderStream(fragment_file_path, std::ios::in);
	if(FragmentShaderStream.is_open()){
		std::string Line = "";
		while(getline(FragmentShaderStream, Line))
			FragmentShaderCode += "\n" + Line;
		FragmentShaderStream.close();
	}



	GLint Result = GL_FALSE;
	int InfoLogLength;



	// Compile Vertex Shader
	printf("Compiling shader : %s\n", vertex_file_path);
	char const * VertexSourcePointer = VertexShaderCode.c_str();
	glShaderSource(VertexShaderID, 1, &VertexSourcePointer , NULL);
	glCompileShader(VertexShaderID);

	// Check Vertex Shader
	glGetShaderiv(VertexShaderID, GL_COMPILE_STATUS, &Result);
	glGetShaderiv(VertexShaderID, GL_INFO_LOG_LENGTH, &InfoLogLength);
	if ( InfoLogLength > 0 ){
		std::vector<char> VertexShaderErrorMessage(InfoLogLength+1);
		glGetShaderInfoLog(VertexShaderID, InfoLogLength, NULL, &VertexShaderErrorMessage[0]);
		printf("%s\n", &VertexShaderErrorMessage[0]);
	}



	// Compile Fragment Shader
	printf("Compiling shader : %s\n", fragment_file_path);
	char const * FragmentSourcePointer = FragmentShaderCode.c_str();
	glShaderSource(FragmentShaderID, 1, &FragmentSourcePointer , NULL);
	glCompileShader(FragmentShaderID);

	// Check Fragment Shader
	glGetShaderiv(FragmentShaderID, GL_COMPILE_STATUS, &Result);
	glGetShaderiv(FragmentShaderID, GL_INFO_LOG_LENGTH, &InfoLogLength);
	if ( InfoLogLength > 0 ){
		std::vector<char> FragmentShaderErrorMessage(InfoLogLength+1);
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
	if ( InfoLogLength > 0 ){
		std::vector<char> ProgramErrorMessage(InfoLogLength+1);
		glGetProgramInfoLog(ProgramID, InfoLogLength, NULL, &ProgramErrorMessage[0]);
		printf("%s\n", &ProgramErrorMessage[0]);
	}

	glDeleteShader(VertexShaderID);
	glDeleteShader(FragmentShaderID);

	return ProgramID;
}


/**
* Program initialization.
*/
void init( ShaderInfo& info ) {
	
	glGenVertexArrays( 1, &info.vertexArray );
	glBindVertexArray( info.vertexArray );

	// create and compile our GLSL program from the shaders
	info.programId = LoadShaders( "shaders/vs.glsl", "shaders/fs.glsl" );

	// create a buffer and put a single clipspace triangle in it
	static const GLfloat vertex_buffer_data[] = { 
		-1.0f, -1.0f, 0.0f,
		 1.0f, -1.0f, 0.0f,
		 0.0f,  1.0f, 0.0f,
	};
	
	glGenBuffers( 1, &info.vertexBuffer );
	glBindBuffer( GL_ARRAY_BUFFER, info.vertexBuffer );
	glBufferData( GL_ARRAY_BUFFER, sizeof( vertex_buffer_data ), vertex_buffer_data, GL_STATIC_DRAW );
}


/**
* Main 3D rendering function.
*/
void render3D( ShaderInfo& info ) {

	// clear the screen
	glClear( GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT );

	// Use our shader
	glUseProgram( info.programId );

	// 1st attribute buffer : vertices
	glEnableVertexAttribArray( 0 );
	glBindBuffer( GL_ARRAY_BUFFER, info.vertexBuffer );
	glVertexAttribPointer( 0, 3, GL_FLOAT, GL_FALSE, 0, ( void* ) 0	);

	// draw the triangle
	glDrawArrays( GL_TRIANGLES, 0, 3 ); // 3 indices starting at 0 -> 1 triangle
	glDisableVertexAttribArray( 0 );
}


/**
* Program Entry Point.
*/
int main( int argc, char** argv ) {

	ShaderInfo info;

	// initialize GLFW
	if( !glfwInit() ) {
		fprintf( stderr, "Failed to initialize GLFW!\n" );
		return -1;
	}

	glfwWindowHint( GLFW_SAMPLES, 4 );
	glfwWindowHint( GLFW_CONTEXT_VERSION_MAJOR, 3 );
	glfwWindowHint( GLFW_CONTEXT_VERSION_MINOR, 3 );
	glfwWindowHint( GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE );

	// open a window and create its OpenGL context
	window = glfwCreateWindow( 1280, 720, "CSC561 - Starter Project", NULL, NULL );
	if( window == NULL ) {
		fprintf( stderr, "Failed to open GLFW window. If you have an Intel GPU, they are not 3.3 compatible.\n" );
		glfwTerminate();
		return -1;
	}
	glfwMakeContextCurrent( window );

	// initialize GLEW
	glewExperimental = true; // Needed for core profile
	if( glewInit() != GLEW_OK ) {
		fprintf( stderr, "Failed to initialize GLEW\n" );
		return -1;
	}

	// ensure we can capture the escape key being pressed below
	glfwSetInputMode( window, GLFW_STICKY_KEYS, GL_TRUE );

	// set the GL clear color
	glClearColor( 0.f, 0.f, 0.f, 0.f );

	// load shaders and bind arrays
	info.programId = NULL;
	info.vertexArray = NULL;
	info.vertexBuffer = NULL;
	init( info );

	do {
		// draw
		render3D( info );
		
		// swap buffers
		glfwSwapBuffers( window );
		glfwPollEvents();

	} // check if the ESC key was pressed or the window was closed
	while( glfwGetKey( window, GLFW_KEY_ESCAPE ) != GLFW_PRESS && glfwWindowShouldClose( window ) == 0 );

	// close OpenGL window and terminate GLFW
	glfwTerminate();

	return 0;
}


#endif


/*********************************************************************************************************************
* Immediate mode example.
*********************************************************************************************************************/

#ifdef COMPATIBILITY

// include GLUT
#include <gl\GL.h>
#include <gl\GLU.h>
#include "glut/glut.h"

struct PixelInfo {
	float r;
	float g;
	float b;
};


/**
* Main 2D rendering function.
*/
void render2D() {

	GLuint x, y, index;
	GLfloat r, g, b;

	// create a pixel array
	PixelInfo* pixels = new PixelInfo[ ( 1280 * 720 )];
	memset( pixels, 0, sizeof( PixelInfo ) * 1280 * 720 );

	// clear the screen
	glClear( GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT );

	// draw randomly colored dots
	for( unsigned int i = 0; i < 10000; i++ ) {
		x = rand() % 1280;
		y = rand() % 720;
		r = ( float ) rand() / ( float ) RAND_MAX;
		g = ( float ) rand() / ( float ) RAND_MAX;
		b = ( float ) rand() / ( float ) RAND_MAX;
		
		index = ( x * y );
		pixels[index].r = r;
		pixels[index].g = g;
		pixels[index].b = b;
	}

	// update the buffer
	glDrawPixels( 1280, 720, GL_RGB, GL_FLOAT, pixels );

	// swap the back buffer
	glutSwapBuffers();

	// delete the temporary buffer
	delete[] pixels;
}


/**
* Input handler.
*/
void keyboard( unsigned char key, int x, int y ) {
	switch( key ) {
		case 27:
			exit( 0 );
			break;
		default:
			break;
	}
}


/**
* Program Entry Point.
*/
int main ( int argc, char** argv ) {

	glutInit( &argc, argv );
	glutInitDisplayMode( GLUT_RGB | GLUT_DEPTH | GLUT_DOUBLE );
	glutInitWindowSize( 1280, 720 );
	glutInitWindowPosition( 0, 0 );
	glutCreateWindow( "CSC561 - Starter Project" );

	// set the GL clear color
	glClearColor( 0.f, 0.f, 0.f, 0.f );

	glutDisplayFunc( render3D );
	glutKeyboardFunc( keyboard );
	glutMainLoop();

	return 0;
}

#endif