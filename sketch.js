// Definir constantes básicas
const PI = Math.PI;
const TWO_PI = PI * 2;

// Categorías para asignar el estilo a los nodos
const strongTitles = [
  "TEORIAS /REFLEXIONES",
  "MEDIAR MATERIA",
  "Perder el Tiempo",
  "Tecnologías para Tocar lo Invisible",
  "Espectro Derivas",
  "SER-VER",
];
const subsubtitleTitles = [
  "Materia Digital",
  "Materia Vibrante",
  "(ooa)",
  "(ooo)",
  "Narrativas",
  "Escala",
  "Espacialidad",
  "Ficción",
  "Hiperstición",
  "Fotogrametría",
  "Optimización 3D",
  "Realidad Aumentada",
];

// Grupos asignados y sus enlaces:
const groupEntramado = ["Narrativas", "Espacialidad", "Escala"];
const groupFicciones = ["Hiperstición", "Ficción"];
const groupObservaciones = [
  "(ooo)",
  "Materia Vibrante",
  "Materia Digital",
  "(ooa)",
];

const groupLinks = {
  "Entramado Realidad": "https://ser-ver.hotglue.me/?entramado%20realidad/",
  "Ficciones como alternativas":
    "https://ser-ver.hotglue.me/?alternativa%20ficci%C3%B3n",
  "Observaciones Sutiles":
    "https://ser-ver.hotglue.me/?invitaci%C3%B3n%20a%20observaciones%20sutiles",
};

// Parámetros para el arco de la etiqueta curvada.
// Aumentamos el rango del arco a 1.0π a 2.0π (180°) y offset de 30 px.
const groupArcStart = 1 * PI;
const groupArcEnd = 2 * PI;
const labelOffset = 10; // Offset adicional al radio del nodo para la etiqueta

// Variables globales para nodos, conexiones y física
let nodes = [];
let connections = [];
let springs = [];
let draggingNode = null;
let influenceFactor = 0.0025;
let damping = 0.85;
let separationFactor = 0.8;
let initialPositions = [];
let dragInfluenceFactor = 0.005;
let clickStartX, clickStartY;
let isDragging = false;
let textCandidate = null;
let groupCandidate = null;

//////////////////////////////////////////////////////
// Clase Node: cada nodo tiene posición, label, link y, si corresponde, un grupo.
//////////////////////////////////////////////////////
class Node {
  constructor(x, y, label, link) {
    this.x = x;
    this.y = y;
    this.label = label;
    this.link = link;
    // Tamaño base calculado según el ancho del texto.
    this.radiusX = max(50, textWidth(label) / 2 + 20);
    this.radiusY = 30;
    this.vx = 0;
    this.vy = 0;
    this.fx = 0;
    this.fy = 0;

    // Asignar grupo según el contenido
    if (groupEntramado.includes(this.label)) {
      this.groupLabel = "Entramado Realidad";
      this.groupLink = groupLinks["Entramado Realidad"];
    } else if (groupFicciones.includes(this.label)) {
      this.groupLabel = "Ficciones como alternativas";
      this.groupLink = groupLinks["Ficciones como alternativas"];
    } else if (groupObservaciones.includes(this.label)) {
      this.groupLabel = "Observaciones Sutiles";
      this.groupLink = groupLinks["Observaciones Sutiles"];
    } else {
      this.groupLabel = null;
      this.groupLink = null;
    }
  }

  display() {
    noStroke();
    let nodeColor;
    // Para nodos fuertes se usan tamaños mayores y forma circular.
    if (strongTitles.includes(this.label)) {
      nodeColor = color(255); // Blanco
      let size;
      if (
        [
          "Perder el Tiempo",
          "Tecnologías para Tocar lo Invisible",
          "Espectro Derivas",
          "SER-VER",
        ].includes(this.label)
      ) {
        size = max(60, textWidth(this.label) + 60);
      } else {
        size = max(80, textWidth(this.label) + 40);
      }
      this.radiusX = size / 2;
      this.radiusY = size / 2;
      // Dibujar el círculo: fondo negro, borde punteado blanco.
      fill(0);
      drawingContext.setLineDash([5, 5]);
      stroke(255);
      strokeWeight(2);
      ellipse(this.x, this.y, size, size);
      drawingContext.setLineDash([]);

      // Texto en blanco sobre el fondo negro.
      noStroke();
      fill(255);
      textFont("Verdana");
      textStyle(BOLD);
      textSize(16);
      textAlign(CENTER, CENTER);
      text(this.label, this.x, this.y);
      textStyle(NORMAL);
    } else {
      // Para nodos restantes, dibujar óvalo con fondo blanco y texto en negro.
      fill(255);
      stroke(0);
      strokeWeight(1);
      ellipse(this.x, this.y, this.radiusX * 2, this.radiusY * 2);

      noStroke();
      fill(0);
      textFont("Verdana");
      textStyle(BOLD);
      textSize(16);
      textAlign(CENTER, CENTER);
      text(this.label, this.x, this.y);
      textStyle(NORMAL);
    }

    if (this.groupLabel) {
      let startAngles = [PI, PI + QUARTER_PI, PI + HALF_PI]; // ángulos alternativos
      let placed = false;
      for (let offset of startAngles) {
        let start = offset;
        let end = offset + PI;
        if (
          !isLabelOverlappingAnyNode(
            this.x,
            this.y,
            this.radiusX + labelOffset,
            this.radiusY + labelOffset,
            this.groupLabel,
            start,
            end,
            this
          )
        ) {
          drawTextAlongEllipse(
            this.x,
            this.y,
            this.radiusX + labelOffset,
            this.radiusY + labelOffset,
            this.groupLabel,
            start,
            end
          );
          placed = true;
          break;
        }
      }
      if (!placed) {
        drawTextAlongEllipse(
          this.x,
          this.y,
          this.radiusX + labelOffset,
          this.radiusY + labelOffset,
          this.groupLabel,
          groupArcStart,
          groupArcEnd
        );
      }
    }
  }

  isMouseOver() {
    let d = dist(mouseX, mouseY, this.x, this.y);
    return d < this.radiusX;
  }

  isMouseOverText() {
    textFont("Verdana");
    textStyle(NORMAL);
    textSize(15);
    let tw = textWidth(this.label);
    let th = textAscent() + textDescent();
    textStyle(NORMAL);
    return (
      mouseX > this.x - tw / 2 &&
      mouseX < this.x + tw / 2 &&
      mouseY > this.y - th / 2 &&
      mouseY < this.y + th / 2
    );
  }

  // Detectar si se hizo clic sobre la etiqueta curvada (se usa el punto medio del arco)
  isMouseOverGroupLabel() {
    if (!this.groupLabel) return false;
    let midAngle = (groupArcStart + groupArcEnd) / 2;
    let gx = this.x + (this.radiusX + labelOffset) * cos(midAngle);
    let gy = this.y + (this.radiusY + labelOffset) * sin(midAngle);
    return dist(mouseX, mouseY, gx, gy) < 15;
  }
}
function isLabelOverlappingAnyNode(
  cx,
  cy,
  rx,
  ry,
  txt,
  angleStart,
  angleEnd,
  currentNode
) {
  let angleRange = angleEnd - angleStart;
  let angleStep = angleRange / txt.length;

  for (let i = 0; i < txt.length; i++) {
    let angle = angleStart + i * angleStep + angleStep / 2;
    let x = cx + rx * cos(angle);
    let y = cy + ry * sin(angle);

    for (let node of nodes) {
      if (node === currentNode) continue;
      let dx = x - node.x;
      let dy = y - node.y;
      let d = sqrt(dx * dx + dy * dy);
      let r = max(node.radiusX, node.radiusY);

      if (d < r + 10) {
        return true; // Hay superposición
      }
    }
  }
  return false; // No hay superposición
}

//////////////////////////////////////////////////////
// Función para dibujar texto a lo largo de la curva de una elipse.
//////////////////////////////////////////////////////
function drawTextAlongEllipse(cx, cy, rx, ry, txt, startAngle, endAngle) {
  let angleRange = endAngle - startAngle;
  let totalChars = txt.length;
  let angleStep = angleRange / totalChars;
  push();
  textFont("Verdana");
  textStyle(NORMAL);
  textAlign(CENTER, CENTER);
  textSize(14); // Aumentar tamaño para legibilidad
  for (let i = 0; i < totalChars; i++) {
    let angle = startAngle + i * angleStep + angleStep / 2;
    let x = cx + rx * cos(angle);
    let y = cy + ry * sin(angle);
    push();
    translate(x, y);
    rotate(angle + HALF_PI);

    // Sombra del texto
    fill(0, 150); // negro semitransparente
    text(txt.charAt(i), 1.5, 1.5); // pequeño offset

    // Texto blanco encima
    fill(255);
    text(txt.charAt(i), 0, 0);
    pop();
  }
  pop();
}

//////////////////////////////////////////////////////
// Función setup: inicializa nodos, conexiones y resortes.
//////////////////////////////////////////////////////
function setup() {
  createCanvas(2000, 1000);
  textFont("Verdana");
  textSize(20);
  textStyle(BOLD);

  // Definir nodos según el mapeo solicitado.
  // Índices:
  // 0: TEORIAS /REFLEXIONES
  // 1: MEDIAR MATERIA
  // 2: Perder el Tiempo
  // 3: Tecnologías para Tocar lo Invisible
  // 4: Espectro Derivas
  // 5: SER-VER
  // 6: Materia Digital
  // 7: Materia Vibrante
  // 8: (ooa)
  // 9: (ooo)
  // 10: Narrativas
  // 11: Escala
  // 12: Espacialidad
  // 13: Ficción
  // 14: Hiperstición
  // 15: Fotogrametría
  // 16: Optimización 3D
  // 17: Realidad Aumentada
  let nodeData = [
    { label: "TEORIAS /REFLEXIONES", link: "https://ser-ver.hotglue.me/?teorias/" },
    {
      label: "MEDIAR MATERIA",
      link: "https://ser-ver.hotglue.me/?mediarmateria",
    },
    {
      label: "Perder el Tiempo",
      link: "https://ser-ver.hotglue.me/?cienciayarte/",
    },
    {
      label: "Tecnologías para Tocar lo Invisible",
      link: "https://ser-ver.hotglue.me/?silbatos/",
    },
    {
      label: "Espectro Derivas",
      link: "https://ser-ver.hotglue.me/?espectro%20derivas/",
    },
    { label: "SER-VER", link: "https://ser-ver.hotglue.me/?ser-ver" },
    {
      label: "Materia Digital",
      link: "https://ser-ver.hotglue.me/?materia%20digital/",
    },
    {
      label: "Materia Vibrante",
      link: "https://ser-ver.hotglue.me/?materiavibrante",
    },
    { label: "(ooa)", link: "https://ser-ver.hotglue.me/?(ooa)" },
    { label: "(ooo)", link: "https://ser-ver.hotglue.me/?(ooo)" },
    { label: "Narrativas", link: "https://ser-ver.hotglue.me/?narrativa/" },
    {
      label: "Escala",
      link: "https://ser-ver.hotglue.me/?escala%20y%20procesos/",
    },
    {
      label: "Espacialidad",
      link: "https://ser-ver.hotglue.me/?espacialidades",
    },
    { label: "Ficción", link: "https://ser-ver.hotglue.me/?ficcion/" },
    { label: "Hiperstición", link: "https://ser-ver.hotglue.me/?hipersticion" },
    {
      label: "Fotogrametría",
      link: "https://ser-ver.hotglue.me/?fotogrametria",
    },
    {
      label: "Optimización 3D",
      link: "https://ser-ver.hotglue.me/?optimizacion%203D",
    },
    { label: "Realidad Aumentada", link: "https://ser-ver.hotglue.me/?AR/" },
  ];

  // Asignar posición aleatoria a cada nodo.
  for (let i = 0; i < nodeData.length; i++) {
    let posX = random(200, 1300);
    let posY = random(100, 700);
    let node = new Node(posX, posY, nodeData[i].label, nodeData[i].link);
    nodes.push(node);
    initialPositions.push({ x: node.x, y: node.y });
  }

  // Definir conexiones según lo solicitado:
  let conn = [];

  // Desde TEORIAS /REFLEXIONES (índice 0) a:
  // Materia Digital (6), Materia Vibrante (7), (ooa) (8), (ooo) (9), Narrativas (10), Escala (11), Espacialidad (12), Ficción (13) y Hiperstición (14)
  conn.push(
    [0, 6],
    [0, 7],
    [0, 8],
    [0, 9],
    [0, 10],
    [0, 11],
    [0, 12],
    [0, 13],
    [0, 14]
  );

  // De MEDIAR MATERIA (índice 1) a: Fotogrametría (15), Optimización 3D (16) y Realidad Aumentada (17)
  conn.push([1, 15], [1, 16], [1, 17]);

  // De Perder el Tiempo (índice 2) a:
  // Narrativas (10), Espacialidad (12), Escala (11), Hiperstición (14), Ficción (13),
  // (ooo) (9), Materia Vibrante (7), Materia Digital (6), (ooa) (8),
  // Fotogrametría (15), Optimización 3D (16) y Realidad Aumentada (17)
  conn.push(
    [2, 10],
    [2, 12],
    [2, 11],
    [2, 14],
    [2, 13],
    [2, 9],
    [2, 7],
    [2, 6],
    [2, 8],
    [2, 15],
    [2, 16],
    [2, 17]
  );

  // De Tecnologías para Tocar lo Invisible (índice 3) a:
  // Narrativas (10), Espacialidad (12), (ooo) (9), Materia Vibrante (7),
  // Materia Digital (6), (ooa) (8), Fotogrametría (15), Optimización 3D (16) y Realidad Aumentada (17)
  conn.push(
    [3, 10],
    [3, 12],
    [3, 9],
    [3, 7],
    [3, 6],
    [3, 8],
    [3, 15],
    [3, 16],
    [3, 17]
  );

  // De Espectro Derivas (índice 4) a:
  // Narrativas (10), Espacialidad (12), Escala (11), Hiperstición (14), Ficción (13),
  // (ooo) (9), Materia Vibrante (7), Materia Digital (6), (ooa) (8), Fotogrametría (15), Optimización 3D (16) y Realidad Aumentada (17)
  conn.push(
    [4, 10],
    [4, 12],
    [4, 11],
    [4, 14],
    [4, 13],
    [4, 9],
    [4, 7],
    [4, 6],
    [4, 8],
    [4, 15],
    [4, 16],
    [4, 17]
  );

  // De SER-VER (índice 5) a:
  // Espectro Derivas (4), Tecnologías para Tocar lo Invisible (3) y Perder el Tiempo (2)
  conn.push([5, 4], [5, 3], [5, 2]);

  connections = conn;

  // Crear resortes según las posiciones iniciales
  for (let c of connections) {
    let i = c[0],
      j = c[1];
    let d = dist(
      initialPositions[i].x,
      initialPositions[i].y,
      initialPositions[j].x,
      initialPositions[j].y
    );
    springs.push({ i: i, j: j, restLength: d });
  }
}

//////////////////////////////////////////////////////
// Función draw: actualiza la física y dibuja todo.
//////////////////////////////////////////////////////
function draw() {
  background(15);

  // Reiniciar fuerzas en cada nodo
  for (let node of nodes) {
    node.fx = 0;
    node.fy = 0;
  }

  // Aplicar fuerzas de resorte entre nodos
  for (let s of springs) {
    let nodeA = nodes[s.i];
    let nodeB = nodes[s.j];
    let dx = nodeB.x - nodeA.x;
    let dy = nodeB.y - nodeA.y;
    let d = sqrt(dx * dx + dy * dy);
    if (d === 0) continue;
    let force = influenceFactor * (d - s.restLength);
    let fx = (force * dx) / d;
    let fy = (force * dy) / d;
    if (draggingNode !== nodeA) {
      nodeA.fx += fx;
      nodeA.fy += fy;
    }
    if (draggingNode !== nodeB) {
      nodeB.fx -= fx;
      nodeB.fy -= fy;
    }
  }

  // Fuerza de repulsión para evitar superposición
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      let nodeA = nodes[i];
      let nodeB = nodes[j];
      let dx = nodeB.x - nodeA.x;
      let dy = nodeB.y - nodeA.y;
      let d = sqrt(dx * dx + dy * dy);
      let minDist = nodeA.radiusX + nodeB.radiusX;
      if (d < minDist && d > 0) {
        let force = separationFactor * (minDist - d);
        let fx = (force * dx) / d;
        let fy = (force * dy) / d;
        if (draggingNode !== nodeA) {
          nodeA.fx -= fx;
          nodeA.fy -= fy;
        }
        if (draggingNode !== nodeB) {
          nodeB.fx += fx;
          nodeB.fy += fy;
        }
      }
    }
  }
  // Fuerza de repulsión para evitar que etiquetas de grupo se superpongan con nodos
  for (let node of nodes) {
    if (!node.groupLabel) continue;
    let labelAngle = (groupArcStart + groupArcEnd) / 2;
    let labelX = node.x + (node.radiusX + labelOffset) * cos(labelAngle);
    let labelY = node.y + (node.radiusY + labelOffset) * sin(labelAngle);

    for (let other of nodes) {
      if (node === other) continue;
      let dx = other.x - labelX;
      let dy = other.y - labelY;
      let d = sqrt(dx * dx + dy * dy);
      let minDist = other.radiusX + 30; // margen alrededor de la etiqueta
      if (d < minDist && d > 0) {
        let force = 0.3 * (minDist - d);
        let fx = (force * dx) / d;
        let fy = (force * dy) / d;

        if (draggingNode !== other) {
          other.fx += fx;
          other.fy += fy;
        }
      }
    }
  }

  // Fuerza extra para nodos conectados al nodo arrastrado
  if (draggingNode !== null) {
    let dragIndex = nodes.indexOf(draggingNode);
    for (let s of springs) {
      if (s.i === dragIndex) {
        let target = nodes[s.j];
        let dx = draggingNode.x - target.x;
        let dy = draggingNode.y - target.y;
        let d = sqrt(dx * dx + dy * dy);
        if (d > 0) {
          let extraForce = dragInfluenceFactor * d;
          target.fx += (extraForce * dx) / d;
          target.fy += (extraForce * dy) / d;
        }
      } else if (s.j === dragIndex) {
        let target = nodes[s.i];
        let dx = draggingNode.x - target.x;
        let dy = draggingNode.y - target.y;
        let d = sqrt(dx * dx + dy * dy);
        if (d > 0) {
          let extraForce = dragInfluenceFactor * d;
          target.fx += (extraForce * dx) / d;
          target.fy += (extraForce * dy) / d;
        }
      }
    }
  }

  // Actualizar posiciones con amortiguamiento y restricciones al canvas
  for (let node of nodes) {
    if (node !== draggingNode) {
      node.vx = (node.vx + node.fx) * damping;
      node.vy = (node.vy + node.fy) * damping;
      node.x += node.vx;
      node.y += node.vy;
    } else {
      node.vx = 0;
      node.vy = 0;
    }
    node.x = constrain(node.x, node.radiusX, width - node.radiusX);
    node.y = constrain(node.y, node.radiusY, height - node.radiusY);
  }

  // Dibujar conexiones (líneas más delgadas)
  stroke(255);
  strokeWeight(1);
  for (let c of connections) {
    let from = nodes[c[0]];
    let to = nodes[c[1]];
    line(from.x, from.y, to.x, to.y);
  }

  // Dibujar nodos
  for (let node of nodes) {
    node.display();
  }
}

//////////////////////////////////////////////////////
// Funciones de interacción con el mouse
//////////////////////////////////////////////////////
function mousePressed() {
  clickStartX = mouseX;
  clickStartY = mouseY;
  isDragging = false;
  textCandidate = null;
  groupCandidate = null;

  // Verificar clic sobre la etiqueta curvada (grupo) de algún nodo.
  for (let node of nodes) {
    if (node.groupLabel && node.isMouseOverGroupLabel()) {
      groupCandidate = { link: node.groupLink };
      return;
    }
  }

  // Verificar clic sobre el texto central de algún nodo.
  for (let node of nodes) {
    if (node.isMouseOverText()) {
      textCandidate = node;
      return;
    }
  }

  // Iniciar arrastre si se hizo clic sobre el óvalo del nodo.
  for (let node of nodes) {
    if (node.isMouseOver()) {
      draggingNode = node;
      break;
    }
  }
}

function mouseDragged() {
  if (draggingNode) {
    draggingNode.x = constrain(
      mouseX,
      draggingNode.radiusX,
      width - draggingNode.radiusX
    );
    draggingNode.y = constrain(
      mouseY,
      draggingNode.radiusY,
      height - draggingNode.radiusY
    );
    isDragging = true;
  }
}

function mouseReleased() {
  if (draggingNode) {
    draggingNode = null;
  }
  if (groupCandidate && !isDragging) {
    window.open(groupCandidate.link, "_blank");
    groupCandidate = null;
    return;
  }
  if (textCandidate && !isDragging) {
    window.open(textCandidate.link, "_blank");
  }
  textCandidate = null;
  isDragging = false;
}
