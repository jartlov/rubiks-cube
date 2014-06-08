var canvas;
var gl;
var shaderProgram;
var vertexPosition;
var vertexColor;
var modelViewMatrix = mat4.create();
var projectionMatrix = mat4.create();
var rotationMatrix = mat4.create();
var cubeVerticesBuffer;
var cubeFacesBuffer;
var cubeVerticesColorBuffer;
var cubeOutlineBuffer;
var cubeOutlineColorBuffer;

var mouseDown = false;
var x_init;
var y_init;
var x_new;
var y_new;

var CUBE_COLORS = {
    'white' : [1.0, 1.0, 1.0, 1.0],
    'red' : [1.0, 0.0, 0.0, 1.0],
    'green' : [0.0, 1.0, 0.0, 1.0],
    'blue' : [0.0, 0.0, 1.0, 1.0],
    'yellow' : [1.0, 1.0, 0.0, 1.0],
    'orange' : [1.0, 0.5, 0.0, 1.0],
    'black' : [0.0, 0.0, 0.0, 1.0]
}

function initWebGL(canvas) {
    if (!window.WebGLRenderingContext) {
        console.log("Your browser doesn't support WebGL.")
            return null;
    }
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
        console.log("Your browser supports WebGL, but initialization failed.");
        return null;
    }
    return gl;
}

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }
    var source = '';
    var currentChild = shaderScript.firstChild;
    while (currentChild) {
        if (currentChild.nodeType == currentChild.TEXT_NODE) {
            source += currentChild.textContent;
        }
        currentChild = currentChild.nextSibling;
    }
    var shader;
    if (shaderScript.type == 'x-shader/x-fragment') {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == 'x-shader/x-vertex') {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log('An error occurred while compiling the shader: ' + gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

function initShaders() {
    var fragmentShader = getShader(gl, 'fragmentShader');
    var vertexShader = getShader(gl, 'vertexShader');
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, fragmentShader);
    gl.attachShader(shaderProgram, vertexShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.log('Unable to initialize the shader program');
    }
    gl.useProgram(shaderProgram);
    vertexPosition = gl.getAttribLocation(shaderProgram, 'vertexPosition');
    gl.enableVertexAttribArray(vertexPosition);
    vertexColor = gl.getAttribLocation(shaderProgram, 'vertexColor');
    gl.enableVertexAttribArray(vertexColor);
}

function initCubeBuffers() {
    // cube vertices
    cubeVerticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeModel.vertices), gl.STATIC_DRAW);
    // cube faces
    cubeFacesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeFacesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeModel.faces), gl.STATIC_DRAW);
}

function drawScene() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    drawRubiksCube();
}

function drawCube() {
    // cube vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
    gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
    // cube colors
    var cubeColors = [];
    for (var i = 0; i < cubeModel.vertices.length; i++) {
        cubeColors = cubeColors.concat(CUBE_COLORS['black']);
    }
    cubeVerticesColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeColors), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertexColor, 4, gl.FLOAT, false, 0, 0);
    // cube faces
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeFacesBuffer);
    gl.drawElements(gl.TRIANGLES, cubeModel.faces.length, gl.UNSIGNED_SHORT, 0);
}

function drawRubiksCube() {
    mat4.perspective(projectionMatrix,
            30,
            canvas.width / canvas.height,
            0.1,
            100.0);
    mat4.identity(modelViewMatrix);
    mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -10]);
    mat4.multiply(modelViewMatrix, modelViewMatrix, rotationMatrix);
    var mvMatrix = mat4.create();
    mat4.copy(mvMatrix, modelViewMatrix);
    for (var x = -1; x < 2; x++) {
        for (var y = -1; y < 2; y++) {
            for (var z = -1; z < 2; z++) {
                if (x == 0 && y == 0 && z == 0) {
                    continue;
                }
                mat4.translate(modelViewMatrix, modelViewMatrix, [2 * x, 2 * y, 2 * z]);
                drawCube();
                setMatrixUniforms();
                mat4.copy(modelViewMatrix, mvMatrix);
            }
        }
    }
}

function tick() {
    requestAnimationFrame(tick);
    drawScene();
}

function start() {
    canvas = document.getElementById('glcanvas');
    gl = initWebGL(canvas);
    initShaders();
    initCubeBuffers();
    if (gl) {
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        tick();
    }
}

function setMatrixUniforms() {
    var projectionUniform = gl.getUniformLocation(shaderProgram, 'projectionMatrix');
    gl.uniformMatrix4fv(projectionUniform, false, projectionMatrix);
    var modelViewUniform = gl.getUniformLocation(shaderProgram, 'modelViewMatrix');
    gl.uniformMatrix4fv(modelViewUniform, false, modelViewMatrix);
}

function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

function rotate(event) {
    if (mouseDown) {
        x_new = event.pageX;
        y_new = event.pageY;
        delta_x = (x_new - x_init) / 10;
        delta_y = (y_new - y_init) / 10;
        var axis = [delta_y, delta_x, 0];
        var degrees = Math.sqrt(delta_x * delta_x + delta_y * delta_y);
        var newRotationMatrix = mat4.create();
        mat4.rotate(newRotationMatrix, newRotationMatrix, -degreesToRadians(degrees), axis);
        mat4.multiply(rotationMatrix, newRotationMatrix, rotationMatrix);
    }
}

function startRotate(event) {
    mouseDown = true;
    x_init = event.pageX;
    y_init = event.pageY;
}

function endRotate(event) {
    mouseDown = false;
}

$(document).ready(function() {
    start();
    $('#glcanvas').mousedown(startRotate);
    $('#glcanvas').mousemove(rotate);
    $('#glcanvas').mouseup(endRotate);
});
