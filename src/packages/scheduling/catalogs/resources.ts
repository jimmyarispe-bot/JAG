/** Resource type examples — definitions only (no booking engine). */
export const RESOURCE_TYPE_EXAMPLES = Object.freeze([
  Object.freeze({ id: "room", label: "Room" }),
  Object.freeze({ id: "classroom", label: "Classroom" }),
  Object.freeze({ id: "vehicle", label: "Vehicle" }),
  Object.freeze({ id: "equipment", label: "Equipment" }),
  Object.freeze({ id: "lab", label: "Lab" }),
  Object.freeze({ id: "virtual_room", label: "Virtual Room" }),
] as const);
