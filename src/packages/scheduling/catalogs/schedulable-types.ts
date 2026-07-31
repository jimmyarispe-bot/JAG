/** Example schedulable type keys — industry blueprints decide which exist. */
export const SCHEDULABLE_TYPE_EXAMPLES = Object.freeze([
  Object.freeze({ id: "event", label: "Event" }),
  Object.freeze({ id: "meeting", label: "Meeting" }),
  Object.freeze({ id: "session", label: "Session" }),
  Object.freeze({ id: "appointment", label: "Appointment" }),
  Object.freeze({ id: "shift", label: "Shift" }),
  Object.freeze({ id: "reservation", label: "Reservation" }),
  Object.freeze({ id: "deadline", label: "Deadline" }),
  Object.freeze({ id: "milestone", label: "Milestone" }),
  Object.freeze({ id: "office_hours", label: "Office Hours" }),
  Object.freeze({ id: "availability_block", label: "Availability Block" }),
] as const);
