
varying vec2 vUv;

void main() {
    // Time varying pixel color
    vec3 col = 0.5 + 0.5*cos(vUv.xyx * 5.+vec3(0,2,4));

    gl_FragColor = vec4( col, 1.0 );
}