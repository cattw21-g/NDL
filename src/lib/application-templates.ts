import type { ApplicationRole, ApplicationQuestionType } from "@/generated/prisma/enums";

export interface TemplateQuestion {
  order: number;
  prompt: string;
  description?: string;
  type: ApplicationQuestionType;
  required: boolean;
  options?: string[];
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
}

export interface ApplicationTemplate {
  slug: string;
  title: string;
  role: ApplicationRole;
  description: string;
  requirements: string[];
  defaultMaxPositions?: number;
  questions: TemplateQuestion[];
}

export const APPLICATION_TEMPLATES: Record<ApplicationRole, ApplicationTemplate> = {
  LIST_REVIEWER: {
    slug: "list-reviewer",
    title: "List Reviewer",
    role: "LIST_REVIEWER",
    description:
      "Join the Nerfed Demonlist team as a List Reviewer. You will review record submissions, verify completion videos, check clicks/footage for legitimacy, and maintain the integrity of our leaderboard.",
    requirements: [
      "Active Geometry Dash player with solid knowledge of high-difficulty completions",
      "Familiarity with record verification guidelines, raw footage standards, and click analysis",
      "At least 4-6 hours of weekly availability to review incoming submission queue",
      "Professional and calm communication skills when interacting with players",
      "Active Discord account and membership in the official NDL Discord server",
    ],
    defaultMaxPositions: 5,
    questions: [
      {
        order: 1,
        prompt: "Discord username and timezone / weekly availability",
        description: "Include your Discord handle (e.g. username#0000 or username) and how many hours you can dedicate per week.",
        type: "SHORT_TEXT",
        required: true,
        placeholder: "username | UTC-5 | 6-8 hours/week",
        minLength: 5,
        maxLength: 200,
      },
      {
        order: 2,
        prompt: "How long have you played Geometry Dash and followed Nerfed Demonlist?",
        description: "Give a brief summary of your background in the GD community and your hardest completions.",
        type: "LONG_TEXT",
        required: true,
        placeholder: "I've been playing GD since update 2.0 and following NDL since...",
        minLength: 30,
        maxLength: 1500,
      },
      {
        order: 3,
        prompt: "What experience do you have with Pointercrate / demonlist / review guidelines or verifying completions?",
        description: "Detail any past list team experience, server moderation, or familiarity with verification standards.",
        type: "LONG_TEXT",
        required: true,
        placeholder: "I have experience analyzing completions...",
        minLength: 50,
        maxLength: 2000,
      },
      {
        order: 4,
        prompt: "Walk us through how you would verify a record submission where the video has a cut or audio sync anomaly.",
        description: "Be specific about what tools, frame-by-frame checks, or questions you would ask the submitter.",
        type: "LONG_TEXT",
        required: true,
        placeholder: "First, I inspect the audio waveform and frame progression at the point of the anomaly...",
        minLength: 80,
        maxLength: 3000,
      },
      {
        order: 5,
        prompt: "A player submits a 100% completion of a top 20 level with raw footage, clicks, and fps counter, but their clicks sound unnatural or offset by a few frames. What steps do you take?",
        description: "Explain your investigation process, how you test click synchronization, and when you escalate.",
        type: "LONG_TEXT",
        required: true,
        placeholder: "I would check the exact delay between click audios and frame inputs using audio editing software...",
        minLength: 80,
        maxLength: 3000,
      },
      {
        order: 6,
        prompt: "How do you handle disagreements with another reviewer or a player contesting a rejection?",
        description: "Provide an example or describe your approach to resolving disputes neutrally and adhering to guidelines.",
        type: "LONG_TEXT",
        required: true,
        placeholder: "I maintain a neutral, evidence-based tone and refer directly to list guidelines...",
        minLength: 50,
        maxLength: 2000,
      },
    ],
  },

  LIST_MODERATOR: {
    slug: "list-moderator",
    title: "List Moderator",
    role: "LIST_MODERATOR",
    description:
      "Join as a List Moderator to oversee list operations, handle complex investigations, manage record appeals, review high-profile completions (including Top 10), and maintain community standards.",
    requirements: [
      "Extensive experience in list moderation or GD community leadership",
      "Demonstrated ability to remain impartial and level-headed during high-stakes disputes",
      "Strong analytical ability regarding illegitimate records, click patterns, and physics modifications",
      "Commitment to transparent, accountable moderation actions and team collaboration",
      "Active presence on Discord and website moderation panels",
    ],
    defaultMaxPositions: 2,
    questions: [
      {
        order: 1,
        prompt: "Discord username, age/maturity confirmation, and timezone/availability",
        description: "Confirm your Discord tag, age range, timezone, and realistic weekly schedule.",
        type: "SHORT_TEXT",
        required: true,
        placeholder: "username | 18+ | UTC+1 | 8-10 hours/week",
        minLength: 5,
        maxLength: 200,
      },
      {
        order: 2,
        prompt: "Prior moderation, list team, or community leadership experience",
        description: "Detail any past teams, servers, lists, or communities you have moderated or led.",
        type: "LONG_TEXT",
        required: true,
        placeholder: "I was a moderator on...",
        minLength: 50,
        maxLength: 2500,
      },
      {
        order: 3,
        prompt: "How would you handle a situation where a popular player is suspected of cheating, but the evidence is circumstantial?",
        description: "Detail the steps you would take to gather evidence, collaborate with team members, and ensure due process.",
        type: "LONG_TEXT",
        required: true,
        placeholder: "Circumstantial evidence alone cannot justify an immediate ban without rigorous technical verification...",
        minLength: 80,
        maxLength: 3000,
      },
      {
        order: 4,
        prompt: "A submitter is aggressively arguing with staff in DMs about a rejected record. How do you respond?",
        description: "Describe how you de-escalate, maintain professional boundaries, and redirect to official appeal channels.",
        type: "LONG_TEXT",
        required: true,
        placeholder: "I remain respectful but firm, setting clear boundaries...",
        minLength: 50,
        maxLength: 2500,
      },
      {
        order: 5,
        prompt: "What is your philosophy on nerfed level placements and re-evaluations?",
        description: "How should community consensus, victor opinions, and difficulty tiers be balanced when ranking levels?",
        type: "LONG_TEXT",
        required: true,
        placeholder: "Placements should be primarily informed by victor feedback weighted by recent completions...",
        minLength: 80,
        maxLength: 3000,
      },
      {
        order: 6,
        prompt: "Are you comfortable unlisting/restoring records and communicating decisions publicly with accountability?",
        description: "Confirm your readiness to stand behind staff decisions and provide clear public rationale when necessary.",
        type: "YES_NO",
        required: true,
        options: ["Yes", "No"],
      },
    ],
  },

  BETA_TESTER: {
    slug: "beta-tester",
    title: "Beta Tester",
    role: "BETA_TESTER",
    description:
      "Help test upcoming Nerfed Demonlist features, preview redesigns, test mobile responsiveness, and report bugs before they go live to the public.",
    requirements: [
      "Active user of the Nerfed Demonlist website",
      "Access to at least one primary device/browser (desktop, tablet, or smartphone)",
      "Attention to detail and willingness to document steps to reproduce bugs",
      "Constructive attitude and helpful feedback",
    ],
    defaultMaxPositions: 10,
    questions: [
      {
        order: 1,
        prompt: "Discord username and primary devices / browsers tested on",
        description: "List the devices, operating systems, and browsers you use regularly.",
        type: "SHORT_TEXT",
        required: true,
        placeholder: "username | Windows 11 Chrome, iPhone 15 Safari",
        minLength: 5,
        maxLength: 250,
      },
      {
        order: 2,
        prompt: "How active are you on the NDL website and Discord?",
        description: "How often do you browse the list, submit records, or participate in discussions?",
        type: "SHORT_TEXT",
        required: true,
        placeholder: "Daily on website, check Discord multiple times a week",
        minLength: 10,
        maxLength: 300,
      },
      {
        order: 3,
        prompt: "Describe a bug or UI issue you found on any website or game and how you reported or documented it.",
        description: "Include details like steps to reproduce, device context, and visual documentation.",
        type: "LONG_TEXT",
        required: true,
        placeholder: "While testing a feature on...",
        minLength: 40,
        maxLength: 2000,
      },
      {
        order: 4,
        prompt: "Are you willing to test new features (e.g. list filtering, record submission, mobile views) before release and submit constructive reports?",
        description: "Confirm your commitment to testing new releases and providing feedback.",
        type: "YES_NO",
        required: true,
        options: ["Yes", "No"],
      },
    ],
  },
};
