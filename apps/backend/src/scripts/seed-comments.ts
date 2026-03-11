/**
 * Standalone seeding script — run with:
 *   npx tsx src/scripts/seed-comments.ts
 *
 * Requires MONGODB_URI in the environment (or apps/backend/.env).
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { CannedComment } from '../models/CannedComment';

type SeedEntry = {
  category: string;
  title: string;
  condition: string;
  implication: string;
  recommendation: string;
};

const seedData: SeedEntry[] = [
  // ── Electrical ────────────────────────────────────────────────────────────
  {
    category: 'Electrical',
    title: 'Double-Tapped Breaker',
    condition:
      'Two conductors are sharing a single breaker terminal that is not rated for multiple wires.',
    implication:
      'Creates a loose connection that can arc, overheat, or fail to trip under fault conditions, increasing fire risk.',
    recommendation:
      'Have a licensed electrician separate the circuits onto dedicated breakers or install a tandem (dual) breaker rated for multiple conductors.',
  },
  {
    category: 'Electrical',
    title: 'Missing GFCI Protection',
    condition:
      'Outlets within 1.5 m of water sources (kitchen, bathroom, garage, exterior) lack Ground Fault Circuit Interrupter protection.',
    implication:
      'In the event of a ground fault, shock or electrocution risk is significantly elevated, in violation of CSA C22.1.',
    recommendation:
      'Install GFCI outlets or a GFCI breaker on all circuits serving wet or outdoor locations. Consult a licensed electrician.',
  },
  {
    category: 'Electrical',
    title: 'Open Junction Box',
    condition:
      'An electrical junction box is uncovered, exposing live wire connections inside the wall or ceiling cavity.',
    implication:
      'Exposed conductors present a shock hazard and increase fire risk if the wires are disturbed or damaged.',
    recommendation:
      'Install an appropriate cover plate on the junction box. Ensure all wiring inside is properly connected and protected.',
  },
  {
    category: 'Electrical',
    title: 'Aluminum Branch Wiring',
    condition:
      'Branch circuit wiring is aluminum rather than copper, as identified by the silver conductor colour and markings.',
    implication:
      'Aluminum expands and contracts more than copper, leading to loose connections over time, which can cause overheating and fire.',
    recommendation:
      'Have a licensed electrician evaluate the system and install CO/ALR-rated devices or anti-oxidant connections at all termination points.',
  },
  // ── Plumbing ──────────────────────────────────────────────────────────────
  {
    category: 'Plumbing',
    title: 'Active Leak',
    condition:
      'Water is actively leaking from a supply line, drain fitting, or fixture connection, with visible moisture or dripping noted at time of inspection.',
    implication:
      'Ongoing water intrusion causes mould growth, structural wood decay, and damage to finishes.',
    recommendation:
      'Repair or replace the leaking fitting, valve, or pipe section immediately. A licensed plumber should evaluate the full extent of any water damage.',
  },
  {
    category: 'Plumbing',
    title: 'Galvanized Steel Piping',
    condition:
      'Portions of the water supply system consist of galvanized steel pipe, typically identifiable by gray/zinc-coated threads at joints.',
    implication:
      'Galvanized pipe corrodes from the inside out over time, restricting flow, reducing water pressure, and eventually failing or leaking.',
    recommendation:
      'Plan to replace galvanized sections with copper or cross-linked polyethylene (PEX) tubing. Prioritize areas showing discolouration at fixtures.',
  },
  {
    category: 'Plumbing',
    title: 'S-Trap Present',
    condition:
      'A plumbing drain uses an S-trap configuration rather than a code-compliant P-trap and vent.',
    implication:
      'S-traps can lose their water seal through siphoning, allowing sewer gases including hydrogen sulphide and methane to enter the living space.',
    recommendation:
      'Have a licensed plumber replace the S-trap with a properly vented P-trap assembly in accordance with Ontario Building Code.',
  },
  {
    category: 'Plumbing',
    title: 'Polybutylene (PB) Piping',
    condition:
      'Supply piping is grey polybutylene plastic, identifiable by the "PB2110" stamp on the pipe.',
    implication:
      'Polybutylene is known to fail unexpectedly at fittings, causing significant water damage with little advance warning.',
    recommendation:
      'Replace all polybutylene supply piping with copper or PEX. Contact your insurer, as coverage may be restricted for PB systems.',
  },
  // ── Roofing ───────────────────────────────────────────────────────────────
  {
    category: 'Roofing',
    title: 'Granular Loss on Shingles',
    condition:
      'Significant granular loss is visible on asphalt shingles, with bare asphalt substrate exposed in multiple areas.',
    implication:
      'Granules protect the asphalt from UV degradation. Extensive loss indicates shingles are near end of service life and water infiltration may follow.',
    recommendation:
      'Have a qualified roofing contractor perform a full assessment. Budget for roof replacement within the near term.',
  },
  {
    category: 'Roofing',
    title: 'Lifted or Buckling Shingles',
    condition: 'Multiple shingles are lifting at edges or buckling mid-panel over a defined area.',
    implication:
      'Lifted shingles allow wind-driven rain to enter beneath the shingle layer, leading to sheathing rot and interior leaks.',
    recommendation:
      'A qualified roofing contractor should re-nail and re-seal affected shingles or replace them. Address underlying ventilation or installation issues.',
  },
  {
    category: 'Roofing',
    title: 'Damaged or Missing Flashing',
    condition:
      'Metal flashing at chimneys, skylights, valleys, or wall-to-roof junctions is corroded, bent, improperly sealed, or absent.',
    implication:
      'Flashing failures are a primary cause of roof-related water infiltration into the structure and insulation.',
    recommendation:
      'Have damaged or missing flashing repaired or replaced by a qualified roofing contractor. Apply appropriate sealant where specified.',
  },
  // ── Structure ─────────────────────────────────────────────────────────────
  {
    category: 'Structure',
    title: 'Notched or Bored Joist',
    condition:
      'A floor or ceiling joist has been notched or bored in the tension zone (middle third of span), reducing its structural cross-section.',
    implication:
      'Structural notching outside code-permitted zones weakens the joist and can lead to excessive deflection or failure under load.',
    recommendation:
      'Have a structural engineer or qualified contractor assess the degree of modification and prescribe a repair such as sistering the joist.',
  },
  // ── HVAC ──────────────────────────────────────────────────────────────────
  {
    category: 'HVAC',
    title: 'Furnace Heat Exchanger – Signs of Cracking',
    condition:
      'Visible stress cracks or rust pitting are observed on the heat exchanger surfaces, or the burners show abnormal flame rollout.',
    implication:
      'A cracked heat exchanger can allow combustion gases, including carbon monoxide, to enter the supply air stream — a serious health and safety hazard.',
    recommendation:
      'Have a licensed HVAC technician perform a detailed combustion analysis and heat exchanger inspection. Replace the unit if a crack is confirmed.',
  },
  {
    category: 'HVAC',
    title: 'Inadequate Combustion Air Supply',
    condition:
      'The mechanical room lacks a dedicated fresh-air supply opening, or openings are undersized for the installed equipment BTU rating.',
    implication:
      'Insufficient combustion air causes incomplete combustion, increasing carbon monoxide production and can trigger safety shutdowns.',
    recommendation:
      'Install properly sized combustion air openings or a dedicated duct per manufacturer and OBC requirements. Consult a licensed gas fitter.',
  },
  // ── Basement ──────────────────────────────────────────────────────────────
  {
    category: 'Basement',
    title: 'Evidence of Water Infiltration',
    condition:
      'Efflorescence, staining, or high moisture readings are present on basement foundation walls or floor slab.',
    implication:
      'Chronic moisture infiltration promotes mould growth, degrades concrete, and can indicate hydrostatic pressure issues that worsen over time.',
    recommendation:
      'Improve exterior grading and downspout extensions first. If moisture persists, consult a waterproofing specialist for interior or exterior membrane solutions.',
  },
  // ── Safety ────────────────────────────────────────────────────────────────
  {
    category: 'Safety',
    title: 'Missing or Inoperative Smoke Alarm',
    condition:
      'A required smoke alarm is absent from a sleeping area, floor level, or adjacent hallway, or the installed unit did not respond to test activation.',
    implication:
      'Non-compliant smoke alarm coverage violates the Ontario Fire Code and significantly increases the risk of injury in the event of a fire.',
    recommendation:
      'Install code-compliant smoke alarms on every storey and outside each sleeping area. Test all units after installation.',
  },
  {
    category: 'Safety',
    title: 'Missing Carbon Monoxide Alarm',
    condition:
      'No carbon monoxide alarm is present within 5 metres of each sleeping area in a dwelling that contains a fuel-burning appliance or attached garage.',
    implication:
      'Absence of CO alarms is a violation of the Ontario Fire Code (O. Reg. 213/07) and leaves occupants with no warning of CO accumulation.',
    recommendation:
      'Install ULC-listed CO alarms adjacent to each sleeping area and on each storey. Test after installation and replace per manufacturer schedule.',
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  await mongoose.connect(uri, { bufferCommands: false });
  console.log('Connected to MongoDB');

  const existingCount = await CannedComment.countDocuments();
  if (existingCount > 0) {
    console.log(
      `Database already contains ${existingCount} canned comment(s). Skipping seed to avoid duplicates.`,
    );
    console.log('To re-seed, drop the CannedComments collection first.');
    await mongoose.disconnect();
    return;
  }

  const result = await CannedComment.insertMany(seedData);
  console.log(`Seeded ${result.length} canned comments successfully.`);

  await mongoose.disconnect();
}

seed().catch((error: unknown) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
