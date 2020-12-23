import { cliExecute, toSkill } from "kolmafia";

import {
  $effect,
  $item,
  $skill,
  haveInCampground,
  prop,
} from "..";
import { Copier } from "../Copier";

export const item = $item`Source Terminal`;

export function have(): boolean {
  return haveInCampground(item);
}

/**
 * Buffs that can be acquired from Enhance
 */
export const Buffs = {
  /** +30% Item Drop */
  Items: $effect`items.enh`,
  /** +60% Meat Drop */
  Meat: $effect`meat.enh`,
  /** +50% Initiative */
  Init: $effect`init.enh`,
  /** +10% chance of Critical Hit, +10% chance of Spell Critical Hit */
  Critical: $effect`critical.enh`,
  /** +5 Prismatic Damage */
  Damage: $effect`damage.enh`,
  /** +3 Stats Per Fight */
  Substats: $effect`substats.enh`,
};

/**
 * Acquire a buff from the Source Terminal
 * @param buff The buff to acquire
 * @see Buffs
 */
export function enhance(buff: Effect): boolean {
  if (!Object.values(Buffs).includes(buff)) {
    return false;
  }

  return cliExecute(`terminal enhance ${buff.name}`);
}

/**
 * Rollover buffs that can be acquired from Enquiry
 */
export const RolloverBuffs = {
  /** +5 Familiar Weight */
  Familiar: $effect`familiar.enq`,
  /** +25 ML */
  Monsters: $effect`monsters.enq`,
  /** +5 Prismatic Resistance */
  Protect: $effect`protect.enq`,
  /** +100% Muscle, +100% Mysticality, +100% Moxie */
  Stats: $effect`stats.enq`,
};

/**
 * Acquire a buff from the Source Terminal
 * @param buff The buff to acquire
 * @see RolloverBuffs
 */
export function enquiry(rolloverBuff: Effect): boolean {
  if (!Object.values(RolloverBuffs).includes(rolloverBuff)) {
    return false;
  }

  return cliExecute(`terminal enquiry ${rolloverBuff.name}`);
}

/**
 * Skills that can be acquired from Enhance
 */
export const Skills = {
  /** Collect Source essence from enemies once per combat */
  Extract: $skill`Extract`,
  /** Stagger and create a wandering monster 1-3 times per day */
  Digitize: $skill`Digitize`,
  /** Stagger and deal 25% of enemy HP in damage once per combat */
  Compress: $skill`Compress`,
  /** Double monster's HP, attack, defence, attacks per round and item drops once per fight and once per day (five in The Source) */
  Duplicate: $skill`Duplicate`,
  /** Causes government agent/Source Agent wanderer next turn once per combat and three times per day */
  Portscan: $skill`Portscan`,
  /** Increase Max MP by 100% and recover 1000 MP once per combat with a 30 turn cooldown */
  Turbo: $skill`Turbo`,
};

/**
 * Make a skill available.
 * The Source Terminal can give the player access to two skills at any time
 * @param skill Skill to learn
 * @see Skills
 */
export function educate(skills: Skill | [Skill, Skill]): boolean {
  const skillsArray = Array.isArray(skills) ? skills.slice(0, 2) : [skills];

  for (const skill of skillsArray) {
    if (Object.values(Skills).includes(skill)) return false;

    cliExecute(`terminal educate ${skill.name}`);
  }

  return true;
}

/**
 * Return the Skills currently available from Source Terminal
 */
export function getSkills(): Skill[] {
  return (["sourceTerminalEducate1", "sourceTerminalEducate2"] as const)
    .map((p) => prop(p))
    .filter((s) => s !== "")
    .map((s) => toSkill(s.substring(0, -4)));
}

export function isCurrentSkill(skills: Skill | [Skill, Skill]): boolean {
  const currentSkills = getSkills();
  const skillsArray = Array.isArray(skills) ? skills.slice(0, 2) : [skills];

  return skillsArray.every((skill) => currentSkills.includes(skill));
}

/**
 * Items that can be generated by the Source Terminal
 */
export const Items = {
  /** 4 fullness EPIC food */
  BrowserCookie: $item`browser cookie`,
  /** 4 potency EPIC booze */
  HackedGibson: $item`hacked gibson`,
  /** +10% item drop, improved yield from extraction skill */
  Shades: $item`Source shades`,
  GRAM: $item`Source terminal GRAM chip`,
  PRAM: $item`Source terminal PRAM chip`,
  SPAM: $item`Source terminal SPAM chip`,
  CRAM: $item`Source terminal CRAM chip`,
  DRAM: $item`Source terminal DRAM chip`,
  /** Increase maximum daily casts of Digitze by one, usable once per player */
  TRAM: $item`Source terminal TRAM chip`,
  SoftwareBug: $item`software bug`,
};

/**
 * Collect an item from the Source Terminal (up to three times a day)
 * @param item Item to collect
 * @see Items
 */
export function extrude(item: Item): boolean {
  if (!Object.values(Items).includes(item)) {
    return false;
  }

  return cliExecute(`terminal extrude ${item.name}`);
}

/**
 * Return chips currently installed to player's Source Terminal
 */
export function getChips(): string[] {
  return prop("sourceTerminalChips").split(",");
}

/**
 * Return number of times digitize was cast today
 */
export function getDigitizeUses(): number {
  return prop("_sourceTerminalDigitizeUses");
}

/**
 * Return Monster that is currently digitized, else null
 */
export function getDigitizeMonster(): Monster | null {
  return prop("_sourceTerminalDigitizeMonster");
}

/**
 * Return number of digitized monsters encountered since it was last cast
 */
export function getDigitizeMonsterCount(): number {
  return prop("_sourceTerminalDigitizeMonsterCount");
}

/**
 * Return maximum number of digitizes player can cast
 */
export function getMaximumDigitizeUses(): number {
  const chips = getChips();
  return (
    1 + (chips.includes("TRAM") ? 1 : 0) + (chips.includes("TRIGRAM") ? 1 : 0)
  );
}

/**
 * Returns the current day's number of remaining digitize uses
 */
export function getDigitizeUsesRemaining(): number {
  return getMaximumDigitizeUses() - getDigitizeUses();
}

/**
 * Returns whether the player could theoretically cast Digitize
 */
export function couldDigitize(): boolean {
  return getDigitizeUses() < getMaximumDigitizeUses();
}

export function prepareDigitize(): boolean {
  if (!isCurrentSkill(Skills.Digitize)) {
    return educate(Skills.Digitize);
  }

  return true;
}

/**
 * Returns whether the player can cast Digitize immediately
 * This only considers whether the player has learned the skill
 * and has sufficient daily casts remaining, not whether they have sufficient MP
 */
export function canDigitize(): boolean {
  return couldDigitize() && getSkills().includes(Skills.Digitize);
}

export const Digitize = new Copier(
  () => couldDigitize(),
  () => prepareDigitize(),
  () => canDigitize(),
  () => getDigitizeMonster()
);

/**
 * Return number of times duplicate was cast today
 */
export function getDuplicateUses(): number {
  return prop("_sourceTerminalDuplicateUses");
}

/**
 * Return number of times enhance was cast today
 */
export function getEnhanceUses(): number {
  return prop("_sourceTerminalEnhanceUses");
}

/**
 * Return number of times portscan was cast today
 */
export function getPortscanUses(): number {
  return prop("_sourceTerminalPortscanUses");
}
