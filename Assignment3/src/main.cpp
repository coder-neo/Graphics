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

#ifdef MODERN

// include GLEW
#include "glew/glew.h"

// include GLFW
#include "glfw/glfw3.h"
GLFWwindow* window;

// include GLM
#include "glm/glm.hpp"

using namespace glm;


int main(int argc, char** argv) {

	return 0;
}

#endif

