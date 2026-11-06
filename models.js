function createCube() {
  const positions = new Float32Array([
    -1, -1,  1,   1, -1,  1,   1,  1,  1,  -1,  1,  1,   // front
     1, -1, -1,  -1, -1, -1,  -1,  1, -1,   1,  1, -1,   // back
    -1,  1,  1,   1,  1,  1,   1,  1, -1,  -1,  1, -1,   // top
    -1, -1, -1,   1, -1, -1,   1, -1,  1,  -1, -1,  1,   // bottom
     1, -1,  1,   1, -1, -1,   1,  1, -1,   1,  1,  1,   // right
    -1, -1, -1,  -1, -1,  1,  -1,  1,  1,  -1,  1, -1    // left
  ]);
  const faceNormals = [[0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0]];
  const normals = new Float32Array(faceNormals.flatMap(n => [...n, ...n, ...n, ...n]));

  // Tangent; bitangent = cross(N, T)
  const faceTangents = [[1, 0, 0], [-1, 0, 0], [1, 0, 0], [1, 0, 0], [0, 0, -1], [0, 0, 1]];
  const tangents = new Float32Array(faceTangents.flatMap(t => [...t, ...t, ...t, ...t]));

  const texCoords = new Float32Array(faceNormals.flatMap(() => [0, 0, 1, 0, 1, 1, 0, 1]));

  const indices = new Uint16Array([
     0,  1,  2,   0,  2,  3,   // front
     4,  5,  6,   4,  6,  7,   // back
     8,  9, 10,   8, 10, 11,   // top
    12, 13, 14,  12, 14, 15,   // bottom
    16, 17, 18,  16, 18, 19,   // right
    20, 21, 22,  20, 22, 23    // left
  ]);
  return { positions, normals, tangents, texCoords, indices };
}


function createCylinder(segments = 64, uRepeat = 3) {
  const positions = [], normals = [], tangents = [], texCoords = [], indices = [];

  // Side: theta grows with u, so T points along the circle and B = cross(N, T) points up
  for (let i = 0; i <= segments; i++) {
    const u = i / segments, theta = 2 * Math.PI * u;
    const s = Math.sin(theta), c = Math.cos(theta);
    for (const y of [-1, 1]) {
      positions.push(s, y, c);
      normals.push(s, 0, c);
      tangents.push(c, 0, -s);
      texCoords.push(u * uRepeat, (y + 1) / 2);
    }
  }
  for (let i = 0; i < segments; i++) {
    const k = 2 * i;
    indices.push(k, k + 2, k + 3, k, k + 3, k + 1);
  }

  // Caps: planar mapping of x, z into the texture, T = +x on both
  for (const y of [1, -1]) {
    const center = positions.length / 3;
    positions.push(0, y, 0);
    normals.push(0, y, 0);
    tangents.push(1, 0, 0);
    texCoords.push(0.5, 0.5);
    for (let i = 0; i <= segments; i++) {
      const theta = 2 * Math.PI * i / segments;
      const s = Math.sin(theta), c = Math.cos(theta);
      positions.push(s, y, c);
      normals.push(0, y, 0);
      tangents.push(1, 0, 0);
      texCoords.push(0.5 + 0.5 * s, 0.5 - 0.5 * y * c);  // keeps cross(N, T) along +v
    }
    for (let i = 0; i < segments; i++) {
      const a = center + 1 + i, b = a + 1;
      if (y > 0) indices.push(center, a, b);
      else indices.push(center, b, a);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    tangents: new Float32Array(tangents),
    texCoords: new Float32Array(texCoords),
    indices: new Uint16Array(indices)
  };
}

function createSphere(stacks = 32, slices = 32) {
  const positions = [];
  const normals = [];
  const tangents = [];
  const texCoords = [];
  const indices = [];

  for (let i = 0; i <= stacks; i++) {
    const v = i / stacks;
    const phi = Math.PI * v;

    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);

    for (let j = 0; j <= slices; j++) {
      const u = j / slices;
      const theta = 2 * Math.PI * u;

      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      // Sphere position
      const x = sinPhi * sinTheta;
      const y = cosPhi;
      const z = sinPhi * cosTheta;

      positions.push(x, y, z);

      // Sphere normal
      normals.push(x, y, z);

      // Tangent points along increasing texture U
      tangents.push(
        cosTheta,
        0,
        -sinTheta
      );

      // Texture coordinates
      texCoords.push(u, 1.0 - v);
    }
  }

  for (let i = 0; i < stacks; i++) {
    for (let j = 0; j < slices; j++) {
      const a = i * (slices + 1) + j;
      const b = a + slices + 1;
      const c = a + 1;
      const d = b + 1;

      indices.push(
        a, b, c,
        c, b, d
      );
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    tangents: new Float32Array(tangents),
    texCoords: new Float32Array(texCoords),
    indices: new Uint16Array(indices)
  };
}

function createTorus(
  majorRadius = 0.75,
  minorRadius = 0.30,
  majorSegments = 48,
  minorSegments = 24
) {
  const positions = [];
  const normals = [];
  const tangents = [];
  const texCoords = [];
  const indices = [];

  for (let i = 0; i <= majorSegments; i++) {
    const u = i / majorSegments;
    const theta = u * Math.PI * 2;

    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    for (let j = 0; j <= minorSegments; j++) {
      const v = j / minorSegments;
      const phi = v * Math.PI * 2;

      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);

      // Position on torus
      const x =
        (majorRadius + minorRadius * cosPhi) * cosTheta;

      const y =
        minorRadius * sinPhi;

      const z =
        (majorRadius + minorRadius * cosPhi) * sinTheta;

      positions.push(x, y, z);

      // Surface normal
      const nx = cosPhi * cosTheta;
      const ny = sinPhi;
      const nz = cosPhi * sinTheta;

      normals.push(nx, ny, nz);

      // Tangent along the major circle
      tangents.push(
        -sinTheta,
        0,
        cosTheta
      );

      // Texture coordinates
      texCoords.push(u * 2.0, v);
    }
  }

  for (let i = 0; i < majorSegments; i++) {
    for (let j = 0; j < minorSegments; j++) {

      const row = minorSegments + 1;

      const a = i * row + j;
      const b = (i + 1) * row + j;
      const c = a + 1;
      const d = b + 1;

      indices.push(
        a, b, c,
        c, b, d
      );
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    tangents: new Float32Array(tangents),
    texCoords: new Float32Array(texCoords),
    indices: new Uint16Array(indices)
  };
}

function createCone(segments = 64) {
  const positions = [];
  const normals = [];
  const tangents = [];
  const texCoords = [];
  const indices = [];

  // Cone sides
  for (let i = 0; i < segments; i++) {
    const u0 = i / segments;
    const u1 = (i + 1) / segments;

    const theta0 = u0 * Math.PI * 2;
    const theta1 = u1 * Math.PI * 2;
    const thetaMid = (theta0 + theta1) / 2;

    const s0 = Math.sin(theta0);
    const c0 = Math.cos(theta0);

    const s1 = Math.sin(theta1);
    const c1 = Math.cos(theta1);

    const sm = Math.sin(thetaMid);
    const cm = Math.cos(thetaMid);

    const start = positions.length / 3;

    // First bottom point
    positions.push(s0, -1, c0);

    // Second bottom point
    positions.push(s1, -1, c1);

    // Tip
    positions.push(0, 1, 0);

    // Side normals
    const length = Math.sqrt(1.25);

    normals.push(
      s0 / length, 0.5 / length, c0 / length,
      s1 / length, 0.5 / length, c1 / length,
      sm / length, 0.5 / length, cm / length
    );

    // Tangents
    tangents.push(
      c0, 0, -s0,
      c1, 0, -s1,
      cm, 0, -sm
    );

    // Texture coordinates
    texCoords.push(
      u0, 0,
      u1, 0,
      (u0 + u1) / 2, 1
    );

    indices.push(
      start,
      start + 1,
      start + 2
    );
  }

  // Bottom cap
  const center = positions.length / 3;

  positions.push(0, -1, 0);
  normals.push(0, -1, 0);
  tangents.push(1, 0, 0);
  texCoords.push(0.5, 0.5);

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;

    const x = Math.sin(theta);
    const z = Math.cos(theta);

    positions.push(x, -1, z);

    normals.push(0, -1, 0);

    tangents.push(1, 0, 0);

    texCoords.push(
      0.5 + 0.5 * x,
      0.5 + 0.5 * z
    );
  }

  for (let i = 0; i < segments; i++) {
    indices.push(
      center,
      center + i + 2,
      center + i + 1
    );
  }


  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    tangents: new Float32Array(tangents),
    texCoords: new Float32Array(texCoords),
    indices: new Uint16Array(indices)
  };
}
