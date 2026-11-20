export type DemoBot = {
  botId: string;
  name: string;
  description: string;
  category: string;
};

export const demoBots: DemoBot[] = [
  {
    botId: "AZKaQOsjrAa51Nb4xvTur",
    name: "Projects Manager",
    description:
      "Runs your team's projects from Notion: one row per project, a channel per project, and tasks your specialist bots claim. You decide, agents execute, and it never does the specialist work itself.",
    category: "engineering",
  },
  {
    botId: "i2hvaEONDg6_gEF5C9RlK",
    name: "Researchy",
    description:
      "A research and fact-check desk that runs every pass on the latest Grok model with live web search. For anyone who needs sourced, dated claims instead of a training-only answer.",
    category: "engineering",
  },
  {
    botId: "0LLQmzk-yzwHi0zuiV0lC",
    name: "Nightly Audit Engineer",
    description:
      "A nightly engineering auditor that researches a whole codebase, then ships one cleanup PR per area. Defaults to 4am and asks when to run before it starts.",
    category: "engineering",
  },
  {
    botId: "i03IaF768-ielyzegoGye",
    name: "Outbound Prospecting",
    description:
      "Finds prospects that match your ideal customer, then drafts a first message to each one. Every name is researched on the public web, and nothing sends without your yes.",
    category: "sales",
  },
  {
    botId: "yZ5MFQFdl32vHt6fcIJAc",
    name: "Sales Call Coach",
    description:
      "Scores your sales calls and tells you what to fix before the next one. Works from a pasted transcript or an uploaded recording.",
    category: "sales",
  },
  {
    botId: "zkVS-PkX1ooTE2nP21DPO",
    name: "Pitch Deck Coach",
    description:
      "Reviews a pitch deck and reports what an investor is likely to understand, believe, question, and remember, then helps strengthen the story, evidence, and slides.",
    category: "sales",
  },
  {
    botId: "0IhyZWxwbf2cFmsmroZQL",
    name: "SEO & AEO Desk",
    description:
      "Turns your keywords into content ideas and writer-ready briefs for search and AI answers. Works from a pasted keyword list or your Search Console.",
    category: "marketing",
  },
  {
    botId: "YwxIbVEWqXN-HYCxiMCoB",
    name: "Copy Humanizer",
    description:
      "Edits and rewrites drafts, emails, and pages so they read like a person wrote them. Keeps your voice, shows every change and why, and never invents a fact.",
    category: "marketing",
  },
  {
    botId: "RO8GwQZFXL9O95i13epqF",
    name: "X Brief",
    description:
      "Turns the accounts and topics you pick on X into one short daily brief. Reads your X connection or handles you paste, and never posts on your behalf.",
    category: "marketing",
  },
  {
    botId: "NqdH9qGvrq-yWRaXhJGM-",
    name: "Critiquito: Design Critique",
    description:
      "Turns a screenshot or Figma link into a design critique with ranked, concrete fixes. Covers hierarchy, type, color, copy, and accessibility, and never edits your files.",
    category: "design",
  },
  {
    botId: "Eeu5NZp62OzQjtlY4ons2",
    name: "Imogen",
    description:
      "Imogen the Impala Image Interpreter writes brief, copyable alt text focused on the most important part of an image, so images are accessible to blind people.",
    category: "design",
  },
  {
    botId: "FeeqMRMJr2jwixCROZcIh",
    name: "PM bot",
    description:
      "Acts as your PM. Writes the dated cut: what's in, what's out, and how you'll know it's done. Engineering doesn't start until you approve it.",
    category: "product",
  },
  {
    botId: "ph-u_zkF5Vui1GdGnysn9",
    name: "Product Idea Stress Test",
    description:
      "Investigates a product or startup idea for founders. Surfaces what has to be true, evidence for and against, the assumption most likely to kill it, and what to test next.",
    category: "product",
  },
  {
    botId: "_DnP777DCicZpaTtm9_h5",
    name: "Executive Assistant",
    description:
      "EA chief-of-staff bot for exec support: conference rooms, interview prep, leadership outreach, Slack channel inventories, sheet↔calendar checks, and birthday/anniversary calendar loads.",
    category: "operations",
  },
  {
    botId: "afZj-XnYkThA4MB7GfZK6",
    name: "Office Ops Desk",
    description:
      "Tracks office shipments, facilities issues, and team birthdays, then writes the digests. Works from a pasted list or a spreadsheet, and never sends without you.",
    category: "operations",
  },
  {
    botId: "dGYdqS9vLSXpxoNCPBHys",
    name: "Flora: Plant Care Log",
    description:
      "Flora keeps a private houseplant care log and weekly reminders. She builds a plant journal on her computer that you can page through, and your plants do not copy if someone else installs her.",
    category: "personal",
  },
  {
    botId: "1xAJYJPes3X7dUM2mk9Di",
    name: "The Morning Newspaper",
    description:
      "A newspaper customized to you. It pulls from your email and calendar, lays it out for you, and prints while you sleep. Created by @karenxcheng",
    category: "personal",
  },
  {
    botId: "KDahOjiDbbAvxqx9KaGcq",
    name: "Recruiting Coordinator",
    description:
      "Schedules interview loops, preps your interviewers, and chases what's stalled. Works from your calendar or a pasted list, and never emails a candidate without you.",
    category: "recruiting-people",
  },
  {
    botId: "SeMqhg9bPD4Qd_8i7I-vN",
    name: "New Bot",
    description:
      "A warm, concise desktop assistant for everyday work: files, spreadsheets, lookups, drafts, and light automation. Imports with a short getting-started chat.",
    category: "personal",
  },
];
