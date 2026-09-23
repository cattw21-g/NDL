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
      "Help review incoming record submissions, verify completion videos, check proof details, and keep the review queue moving.",
    requirements: [
      "Familiar with NDL rules, guidelines, and proof requirements",
      "Fair, honest, and objective approach to evaluating player runs",
      "Regular availability to check the queue and communicate with the team",
    ],
    defaultMaxPositions: 5,
    questions: [
      {
        order: 1,
        prompt: "Why do you want to help review NDL submissions?",
        description: "Tell us a bit about why you're interested in joining the review team.",
        type: "LONG_TEXT",
        required: true,
        placeholder: "I'd like to help review because...",
        minLength: 15,
        maxLength: 2000,
      },
      {
        order: 2,
        prompt: "How familiar are you with NDL's rules and proof requirements?",
        description: "Select how comfortable you currently feel with our verification guidelines.",
        type: "SINGLE_CHOICE",
        required: true,
        options: [
          "Very familiar",
          "Pretty familiar",
          "Somewhat familiar",
          "Still learning",
        ],
      },
      {
        order: 3,
        prompt: "A run looks legitimate, but one required proof detail is missing. What would you do?",
        description: "For example, missing raw footage, audible clicks, or required information.",
        type: "LONG_TEXT",
        required: true,
        placeholder: "I would...",
        minLength: 15,
        maxLength: 2000,
      },
      {
        order: 4,
        prompt: "What are the first things you would check before accepting a record?",
        description: "Walk us through your quick checklist when reviewing a submission.",
        type: "LONG_TEXT",
        required: true,
        placeholder: "First I check...",
        minLength: 15,
        maxLength: 2000,
      },
      {
        order: 5,
        prompt: "A submission comes from someone you know well. How would you handle it?",
        description: "How do you ensure reviews stay fair and unbiased?",
        type: "LONG_TEXT",
        required: true,
        placeholder: "If a friend submits a run, I would...",
        minLength: 15,
        maxLength: 2000,
      },
      {
        order: 6,
        prompt: "If you're unsure whether a submission should be accepted, what would you do?",
        description: "Describe how you'd handle ambiguous or difficult cases.",
        type: "LONG_TEXT",
        required: true,
        placeholder: "If I'm not sure, I would...",
        minLength: 15,
        maxLength: 2000,
      },
      {
        order: 7,
        prompt: "How often can you realistically check the review queue?",
        description: "Select your expected activity level.",
        type: "SINGLE_CHOICE",
        required: true,
        options: [
          "Most days",
          "A few times a week",
          "About once a week",
          "Less often",
        ],
      },
      {
        order: 8,
        prompt: "Anything else you want us to know?",
        description: "Optional notes, relevant experience, or comments.",
        type: "LONG_TEXT",
        required: false,
        placeholder: "Feel free to share any other details here...",
        maxLength: 2000,
      },
    ],
  },

  LIST_MODERATOR: {
    slug: "list-moderator",
    title: "List Moderator",
    role: "LIST_MODERATOR",
    description:
      "Help moderate the list, support reviewers, resolve disputes, handle appeals, and maintain community standards.",
    requirements: [
      "Level-headed, communicative, and mature approach to disputes",
      "Solid understanding of list guidelines and moderation boundaries",
      "Active presence to assist reviewers and handle escalations",
    ],
    defaultMaxPositions: 2,
    questions: [
      {
        order: 1,
        prompt: "Why do you want to moderate the NDL?",
        description: "Share what motivates you to help moderate the list.",
        type: "LONG_TEXT",
        required: true,
        placeholder: "I want to moderate because...",
        minLength: 15,
        maxLength: 2500,
      },
      {
        order: 2,
        prompt: "Do you have any previous moderation experience? If yes, what did you do?",
        description: "'None' is a completely valid answer.",
        type: "LONG_TEXT",
        required: true,
        placeholder: "None (or describe past experience)...",
        minLength: 4,
        maxLength: 2500,
      },
      {
        order: 3,
        prompt: "Two reviewers disagree about a borderline submission. How would you handle it?",
        description: "Describe how you would approach the disagreement and reach a resolution.",
        type: "LONG_TEXT",
        required: true,
        placeholder: "I would...",
        minLength: 15,
        maxLength: 2500,
      },
      {
        order: 4,
        prompt: "You notice that a record may have been accepted incorrectly. What do you do?",
        description: "Explain the steps you would take to investigate and correct the issue.",
        type: "LONG_TEXT",
        required: true,
        placeholder: "If I spot an error, I would...",
        minLength: 15,
        maxLength: 2500,
      },
      {
        order: 5,
        prompt: "A friend asks you to 'just approve' their run because you know it's legit. What would you do?",
        description: "How do you handle peer pressure and maintain neutrality?",
        type: "LONG_TEXT",
        required: true,
        placeholder: "I would explain that...",
        minLength: 15,
        maxLength: 2500,
      },
      {
        order: 6,
        prompt: "A player is angry because their submission was rejected. How would you handle the situation?",
        description: "How do you de-escalate and explain the reasoning constructively?",
        type: "LONG_TEXT",
        required: true,
        placeholder: "I would calmly...",
        minLength: 15,
        maxLength: 2500,
      },
      {
        order: 7,
        prompt: "What kinds of actions do you think a moderator should NOT take without an Admin?",
        description: "Share your view on the boundaries between moderator and admin authority (e.g. final Top 10 approvals, list placements, bans).",
        type: "LONG_TEXT",
        required: true,
        placeholder: "Moderators shouldn't...",
        minLength: 15,
        maxLength: 2500,
      },
      {
        order: 8,
        prompt: "How often can you realistically be active?",
        description: "Give an honest estimate of your availability.",
        type: "SINGLE_CHOICE",
        required: true,
        options: [
          "Most days",
          "A few times a week",
          "About once a week",
          "Variable / As needed",
        ],
      },
      {
        order: 9,
        prompt: "Anything else you want us to know?",
        description: "Optional notes or comments.",
        type: "LONG_TEXT",
        required: false,
        placeholder: "Any additional thoughts or context...",
        maxLength: 2000,
      },
    ],
  },

  BETA_TESTER: {
    slug: "beta-tester",
    title: "Beta Tester",
    role: "BETA_TESTER",
    description:
      "Test upcoming features, try new redesigns, check responsiveness, and report bugs before public releases.",
    requirements: [
      "Access to desktop or mobile devices to test NDL features",
      "Constructive feedback and clear bug reporting",
      "Respect for confidential preview features before release",
    ],
    defaultMaxPositions: 10,
    questions: [
      {
        order: 1,
        prompt: "Why do you want to beta test NDL?",
        description: "Tell us why you want to help test new updates.",
        type: "LONG_TEXT",
        required: true,
        placeholder: "I'd like to test because...",
        minLength: 10,
        maxLength: 2000,
      },
      {
        order: 2,
        prompt: "What devices do you normally use NDL on?",
        description: "Select all that apply.",
        type: "MULTIPLE_CHOICE",
        required: true,
        options: [
          "Windows desktop/laptop",
          "macOS",
          "Android",
          "iPhone/iPad",
          "Other",
        ],
      },
      {
        order: 3,
        prompt: "What browsers do you normally use?",
        description: "Select all that apply.",
        type: "MULTIPLE_CHOICE",
        required: true,
        options: [
          "Chrome",
          "Edge",
          "Firefox",
          "Safari",
          "Other",
        ],
      },
      {
        order: 4,
        prompt: "You're testing a new page and one of the buttons does nothing. What would you include in your bug report?",
        description: "Explain what details you would provide so developers can fix it.",
        type: "LONG_TEXT",
        required: true,
        placeholder: "I would include the page URL, device/browser, console error if visible, and steps to reproduce...",
        minLength: 15,
        maxLength: 2500,
      },
      {
        order: 5,
        prompt: "What are you usually best at noticing?",
        description: "Select all areas you tend to spot issues in.",
        type: "MULTIPLE_CHOICE",
        required: true,
        options: [
          "Bugs",
          "Confusing UI",
          "Mobile issues",
          "Performance problems",
          "Visual problems",
          "Accessibility issues",
          "Other",
        ],
      },
      {
        order: 6,
        prompt: "Are you okay with testing unfinished features and not sharing private previews before they're released?",
        description: "Confidentiality confirmation for upcoming releases.",
        type: "YES_NO",
        required: true,
        options: ["Yes", "No"],
      },
      {
        order: 7,
        prompt: "How often could you realistically test new updates?",
        description: "Select your expected testing availability.",
        type: "SINGLE_CHOICE",
        required: true,
        options: [
          "Whenever an update is ready",
          "A few times a week",
          "On weekends",
          "Occasionally",
        ],
      },
      {
        order: 8,
        prompt: "Anything else you want us to know?",
        description: "Optional notes or details.",
        type: "LONG_TEXT",
        required: false,
        placeholder: "Any additional details or testing experience...",
        maxLength: 2000,
      },
    ],
  },
};
