(function (root, factory) {
  "use strict";
  const engine = factory();
  if (typeof module === "object" && module.exports) module.exports = engine;
  if (root) root.CityQuestEngine = engine;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const columns = Object.freeze([168, 340, 512, 684, 856, 1028]);
  const rows = Object.freeze([136, 284, 432, 580]);
  const start = Object.freeze({ c: 0, r: 3 });
  const goal = Object.freeze({ c: 3, r: 1 });
  const directions = Object.freeze({
    north: [0, -1],
    east: [1, 0],
    south: [0, 1],
    west: [-1, 0]
  });
  const order = ["north", "east", "south", "west"];

  function isNode(node) {
    return Boolean(node && Number.isInteger(node.c) && Number.isInteger(node.r) &&
      node.c >= 0 && node.c < columns.length && node.r >= 0 && node.r < rows.length);
  }
  function same(a, b) {
    return Boolean(a && b && a.c === b.c && a.r === b.r);
  }
  function position(node) {
    if (!isNode(node)) throw new RangeError("Invalid intersection");
    return { x: columns[node.c], y: rows[node.r] };
  }
  function distance(a, b) {
    if (!isNode(a) || !isNode(b)) throw new RangeError("Invalid intersection");
    return Math.abs(a.c - b.c) + Math.abs(a.r - b.r);
  }
  function move(route, next) {
    if (!Array.isArray(route) || route.length === 0 || !route.every(isNode) || !same(route[0], start)) {
      return { route: [start], outcome: "invalid", message: "Please restart the route." };
    }
    if (!isNode(next)) {
      return { route: route.slice(), outcome: "invalid", message: "Choose a crossroads on the map." };
    }
    const current = route[route.length - 1];
    if (same(current, goal)) return { route: route.slice(), outcome: "finished", message: "Destination already reached." };
    if (same(current, next)) return { route: route.slice(), outcome: "same", message: "Choose a neighbouring crossroads." };
    if (route.length > 1 && same(route[route.length - 2], next)) {
      return { route: route.slice(0, -1), outcome: "undo", message: "Last step removed." };
    }
    if (distance(current, next) !== 1) {
      return { route: route.slice(), outcome: "nonadjacent", message: "Move to the next intersection, one block at a time." };
    }
    if (route.some(node => same(node, next))) {
      return { route: route.slice(), outcome: "visited", message: "You've been here. Choose another street or use Undo." };
    }
    const result = route.concat([{ c: next.c, r: next.r }]);
    if (same(next, goal)) {
      const steps = result.length - 1;
      const shortest = distance(start, goal);
      return {
        route: result, outcome: "success",
        message: steps === shortest
          ? "Perfect! You've found a shortest route in " + steps + " blocks."
          : "You made it to the museum in " + steps + " blocks. Can you find a shorter route?"
      };
    }
    return { route: result, outcome: "moved", message: "Good. Continue along the streets towards the museum." };
  }
  function step(route, heading) {
    if (!Object.prototype.hasOwnProperty.call(directions, heading)) {
      return { route: route.slice(), outcome: "invalid", message: "Unknown direction." };
    }
    const last = route[route.length - 1];
    const delta = directions[heading];
    return move(route, { c: last.c + delta[0], r: last.r + delta[1] });
  }
  function heading(a, b) {
    const dc = b.c - a.c;
    const dr = b.r - a.r;
    if (dc === 1 && dr === 0) return "east";
    if (dc === -1 && dr === 0) return "west";
    if (dc === 0 && dr === 1) return "south";
    if (dc === 0 && dr === -1) return "north";
    throw new RangeError("Route must use neighbouring crossroads");
  }
  function turns(route) {
    if (!Array.isArray(route) || route.length < 2) return [];
    const sequence = route.slice(1).map((node, index) => heading(route[index], node));
    const segments = [];
    sequence.forEach(direction => {
      const last = segments[segments.length - 1];
      if (last && last.direction === direction) last.blocks += 1;
      else segments.push({ direction, blocks: 1 });
    });
    return segments;
  }
  function instructions(route) {
    const segments = turns(route);
    if (!segments.length) return "Choose a neighbouring crossroads to begin.";
    let previous = "north";
    const lines = ["Start at Central Station."];
    segments.forEach((segment, index) => {
      const from = order.indexOf(previous);
      const to = order.indexOf(segment.direction);
      const delta = (to - from + 4) % 4;
      const action = delta === 0
        ? (index === 0 ? "Walk" : "Keep walking")
        : delta === 1 ? "Turn right and walk"
        : delta === 3 ? "Turn left and walk"
        : "Turn around and walk";
      lines.push(action + " " + segment.blocks + " " +
        (segment.blocks === 1 ? "block" : "blocks") + " " + segment.direction + ".");
      previous = segment.direction;
    });
    if (same(route[route.length - 1], goal)) lines.push("You've arrived at the City Museum!");
    return lines.join(" ");
  }
  function landmarks() {
    return [
      { id: "station", name: "Central Station", emoji: "🚉", x: 166, y: 661 },
      { id: "museum", name: "City Museum", emoji: "🏛️", x: 680, y: 209 },
      { id: "square", name: "Market Square", emoji: "⛲", x: 512, y: 367 },
      { id: "park", name: "Riverside Park", emoji: "🌳", x: 868, y: 354 },
      { id: "cafe", name: "Sunrise Café", emoji: "☕", x: 354, y: 513 },
      { id: "hospital", name: "Hospital", emoji: "🏥", x: 1027, y: 220 },
      { id: "school", name: "School", emoji: "🏫", x: 515, y: 210 },
      { id: "library", name: "Library", emoji: "📚", x: 868, y: 515 }
    ];
  }
  const scenes = Object.freeze({
    start: {
      actor: "Tourist", line: "Excuse me! I'm trying to find the City Museum. Could you help me?",
      prompt: "Choose how to start the conversation.",
      options: [
        { id: "help", label: "Of course! Walk east along Station Road for two blocks, then turn left towards Market Square.", next: "distance", feedback: "Good! You gave a clear direction and used a polite opening.", tone: "good" },
        { id: "vague", label: "It's over there, somewhere near the centre.", next: "clarify", feedback: "Polite, but not clear enough. The tourist still needs specific directions.", tone: "warn" },
        { id: "wrong", label: "Go west towards the river. You'll see it on your left.", next: "wrongway", feedback: "That is the wrong direction. The museum is northeast of the station.", tone: "warn" }
      ]
    },
    clarify: {
      actor: "Tourist", line: "Sorry, I don't know this city. Could you tell me which street to take?",
      prompt: "Repair the misunderstanding.",
      options: [
        { id: "clarify-help", label: "Sorry, let me be more specific: go east for two blocks, then north to Market Square.", next: "distance", feedback: "Well repaired. You've checked that your directions are clear.", tone: "good" },
        { id: "clarify-bad", label: "Just keep walking. You'll find it.", next: "clarify", feedback: "This does not help. Try giving a street direction and a landmark.", tone: "warn" }
      ]
    },
    wrongway: {
      actor: "Tourist", line: "Wait, is that the river? My map says the museum is in the other direction.",
      prompt: "Acknowledge the mistake and correct it.",
      options: [
        { id: "fix", label: "You're right, I'm sorry. Head east along Station Road, then turn left at Market Square.", next: "distance", feedback: "Excellent repair strategy: acknowledge and correct the mistake.", tone: "good" },
        { id: "insist", label: "Ignore your map. I'm sure it's west.", next: "wrongway", feedback: "That advice could leave someone lost. Check the map and try again.", tone: "warn" }
      ]
    },
    distance: {
      actor: "Tourist", line: "Thanks! I'm carrying a heavy suitcase. Is it far from here?",
      prompt: "Give a helpful follow-up answer.",
      options: [
        { id: "distance-good", label: "It's about five short blocks. I can point out the route on the map if you'd like.", next: "complete", feedback: "Mission complete. You explained the route and offered practical help.", tone: "good" },
        { id: "distance-vague", label: "Maybe, perhaps. I'm not really sure.", next: "distance-repair", feedback: "Try a useful estimate and offer to show the route.", tone: "warn" },
        { id: "distance-bad", label: "It's about thirty kilometres away.", next: "distance-repair", feedback: "That's not consistent with the city map. Try a more realistic answer.", tone: "warn" }
      ]
    },
    "distance-repair": {
      actor: "Tourist", line: "Thirty kilometres? Can you please check the map for me?",
      prompt: "Use the map to correct your answer.",
      options: [
        { id: "repair-short", label: "Sorry, I was mistaken. It's five short blocks on foot. Let me show you.", next: "complete", feedback: "Good recovery. A clear correction builds trust.", tone: "good" },
        { id: "repair-unknown", label: "I don't have time. Goodbye.", next: "distance-repair", feedback: "Try to give the tourist usable information.", tone: "warn" }
      ]
    },
    complete: {
      actor: "Tourist", line: "That's very kind of you. Thanks for your help!",
      prompt: "You've successfully helped a visitor find their way.",
      options: []
    }
  });
  function choose(sceneId, optionId) {
    const scene = scenes[sceneId];
    if (!scene) throw new RangeError("Unknown conversation scene");
    const option = scene.options.find(item => item.id === optionId);
    if (!option || !scenes[option.next]) throw new RangeError("Unknown conversation choice");
    return { next: option.next, feedback: option.feedback, tone: option.tone };
  }

  return Object.freeze({
    columns, rows, start, goal, landmarks, scenes,
    isNode, same, position, distance, move, step, heading, turns, instructions, choose
  });
});
