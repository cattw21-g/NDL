export const fieldHelp = {
  versionNotes:
    "Describe what changed in this accepted version, bugfixes, balance changes, or eligibility exceptions.",
  compatibilityNotes:
    "Explain whether the nerfed version preserves the original route/timing closely enough that an original replay could complete it under matching conditions. This is only a level-eligibility check, not permission to use macros for records.",
  originalName: "The original hard demon this nerfed version is based on.",
  publisher:
    "The account that uploaded or hosts the nerfed version in Geometry Dash.",
  nerfCreator: "The person who made the nerfed version.",
  verifier: "The player who legitimately verified the nerfed version.",
  showcaseUrl:
    "A public video showing the level or verification. Use a full https:// link.",
  rawFootageUrl:
    "Unedited recording proof, usually Google Drive or YouTube unlisted. Required for higher-ranked records.",
  separateMicClickTrack:
    "A separate audio track containing only microphone/click audio, used to help detect fake clicks or macros.",
  cheatIndicatorVisible:
    "Whether the recording shows a visible cheat/mod indicator, such as Mega Hack's cheat indicator.",
  cbfUsed: "Whether Click Between Frames was used for this run.",
  fps: "The FPS cap or FPS value used during the completion.",
  thumbnailFile: "Upload the image shown on the ranked list and level page.",
  thumbnailUrl:
    "Use a direct image URL if uploads are disabled or if the image is hosted elsewhere.",
  rank:
    "The level's position on the ranked list. Inserting at an occupied rank shifts lower levels down.",
  status:
    "Ranked levels appear on the main list. Legacy/removed/pending levels do not occupy main-list ranks.",
} as const;
