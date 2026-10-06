/**
 * The dropdown values on the Florida Clearinghouse person profile.
 *
 * Jimmy, 6 October 2026, recreating crw.flclearinghouse.com/Person/Create as
 * part of hiring. The point of matching their value sets exactly is that he
 * reads an email and retypes it into their form - every value that does not
 * match is a decision he has to make again at the keyboard.
 *
 * THESE ARE THE NCIC / FDLE SETS. Hair and eye colour are the NCIC codes the
 * Clearinghouse inherits; sex and race are Florida's. If one of their
 * dropdowns has an option this list does not, the fix is here and nowhere
 * else - the form reads these arrays.
 *
 * WEIGHT IS NOT HERE. Jimmy deleted that field.
 */

export const US_STATES: readonly { value: string; label: string }[] = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "DC", label: "District of Columbia" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
] as const;

/**
 * Place of birth is the states plus one escape hatch.
 *
 * A staff member born abroad has to be able to finish this form. The
 * Clearinghouse handles that on their side; here it is one option and the
 * country goes in Aliases if it has to go anywhere, because inventing a
 * country list is a bigger decision than this form should be making.
 */
export const PLACE_OF_BIRTH_OPTIONS: readonly { value: string; label: string }[] = [
  ...US_STATES,
  { value: "OUTSIDE_US", label: "Outside the United States" },
] as const;

export const SEX_OPTIONS = ["Male", "Female"] as const;

export const RACE_OPTIONS = [
  "American Indian or Alaskan Native",
  "Asian or Pacific Islander",
  "Black",
  "White",
  "Unknown",
] as const;

/** NCIC hair colour codes, in the order the Clearinghouse lists them. */
export const HAIR_COLOR_OPTIONS = [
  "Bald",
  "Black",
  "Blonde or Strawberry",
  "Blue",
  "Brown",
  "Gray or Partially Gray",
  "Green",
  "Orange",
  "Pink",
  "Purple",
  "Red or Auburn",
  "Sandy",
  "White",
  "Unknown",
] as const;

/** NCIC eye colour codes. */
export const EYE_COLOR_OPTIONS = [
  "Black",
  "Blue",
  "Brown",
  "Gray",
  "Green",
  "Hazel",
  "Maroon",
  "Multicolored",
  "Pink",
  "Unknown",
] as const;

/**
 * Height, 4'0" to 7'11".
 *
 * Built rather than typed out, because a hand-written list of 48 strings is 48
 * chances to skip one. The value and the label are the same string so the
 * email reads the way a person says it.
 */
export const HEIGHT_OPTIONS: readonly string[] = (() => {
  const out: string[] = [];
  for (let feet = 4; feet <= 7; feet += 1) {
    for (let inches = 0; inches <= 11; inches += 1) {
      out.push(`${feet}' ${inches}"`);
    }
  }
  return out;
})();
