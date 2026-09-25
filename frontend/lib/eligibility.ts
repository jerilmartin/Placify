/** Course labels include degrees and specialisations; requirements name disciplines. */
const FAMILIES: Record<string, string[]> = {
  computer_science: ["computer science", "computer engineering", "comp sci", "cse", "cs"],
  information_technology: ["information technology", "info tech", "it"],
  electronics_communication: ["electronics and communication", "electronics communication", "electronic communication", "telecommunication", "ece", "ec"],
  electrical_electronics: ["electrical and electronics", "electrical electronics", "electrical engineering", "electrical", "eee", "ee"],
  mechanical: ["mechanical", "mech", "me"],
  civil: ["civil", "ce"],
  chemical: ["chemical", "chem", "ch"],
  artificial_intelligence: ["artificial intelligence", "machine learning", "ai ml", "aiml", "ai", "ml"],
  data_science: ["data science", "data analytics", "analytics", "ds"],
  cybersecurity: ["cyber security", "cybersecurity", "information assurance", "infosec"],
};

const normalize = (value: string) => (value || "").toLowerCase().match(/[a-z0-9]+/g)?.join(" ") || "";
const containsPhrase = (text: string, phrase: string) => ` ${text} `.includes(` ${phrase} `);
const families = (value: string) => {
  const normalized = normalize(value);
  return new Set(Object.entries(FAMILIES)
    .filter(([, aliases]) => aliases.some((alias) => containsPhrase(normalized, alias)))
    .map(([family]) => family));
};

export function matchesBranch(studentCourse: string, requiredBranch: string): boolean {
  const course = normalize(studentCourse);
  const required = normalize(requiredBranch);
  if (!course || !required) return false;
  if (["all", "any", "all branches", "all branches any degree"].includes(required)) return true;
  if (required === "all engineering branches") {
    const engineering = ["computer_science", "information_technology", "electronics_communication", "electrical_electronics", "mechanical", "civil", "chemical"];
    return engineering.some((family) => families(course).has(family)) || containsPhrase(course, "engineering");
  }
  const requiredFamilies = families(required);
  if (requiredFamilies.size) {
    const courseFamilies = families(course);
    return [...requiredFamilies].some((family) => courseFamilies.has(family));
  }
  return containsPhrase(course, required);
}
