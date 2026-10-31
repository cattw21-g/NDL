import { describe, expect, it } from "vitest";
import {
  buildStaffVoteComponents,
  buildStaffVoteEmbed,
  createStaffVoteModal,
  createStaffVotePayload,
  isStaffMember,
  parseStaffVoteState,
  renderProgressBar,
  type StaffVoteState,
} from "./staff-voting.js";

describe("Staff voting system and interactive poll engine", () => {
  it("renders visual percentage progress bars correctly", () => {
    expect(renderProgressBar(0, 10)).toBe("░░░░░░░░░░");
    expect(renderProgressBar(0.5, 10)).toBe("█████░░░░░");
    expect(renderProgressBar(1, 10)).toBe("██████████");
    expect(renderProgressBar(0.25, 8)).toBe("██░░░░░░");
  });

  it("creates binary approve/reject staff vote payload", () => {
    const payload = createStaffVotePayload({
      title: "Should Silent Clubstep Nerfed be placed at #4?",
      description: "CBF physics check verified by Cattw. Video: https://youtu.be/test",
      options: ["Approve / Yes", "Reject / No"],
      creatorId: "123456789",
      creatorName: "Cattw",
    });

    expect(payload.embeds).toHaveLength(1);
    expect(payload.components).toHaveLength(2);

    const embedJson = payload.embeds[0].toJSON();
    expect(embedJson.title).toContain("Staff Vote: Should Silent Clubstep Nerfed be placed at #4?");
    expect(embedJson.description).toContain("CBF physics check verified by Cattw");
    expect(embedJson.footer?.text).toContain("Creator: 123456789");

    // Binary buttons: 1st row has 2 buttons, Success and Danger
    const row1 = payload.components[0].toJSON();
    expect(row1.components).toHaveLength(2);
    expect(row1.components[0].style).toBe(3); // ButtonStyle.Success
    expect(row1.components[1].style).toBe(4); // ButtonStyle.Danger

    // 2nd row: Retract and Close
    const row2 = payload.components[1].toJSON();
    expect(row2.components).toHaveLength(2);
    expect(row2.components[0].custom_id).toBe("staff_vote_retract");
    expect(row2.components[1].custom_id).toBe("staff_vote_close");
  });

  it("creates multi-option vote payload (up to 4 options)", () => {
    const payload = createStaffVotePayload({
      title: "Where should Grief Nerfed be placed?",
      options: ["Rank #1", "Rank #2", "Rank #3", "Hold / Needs Verification"],
      creatorId: "987654321",
      creatorName: "Electro",
    });

    const row1 = payload.components[0].toJSON();
    expect(row1.components).toHaveLength(4);
    expect(row1.components[0].custom_id).toBe("staff_vote_cast_0");
    expect(row1.components[3].custom_id).toBe("staff_vote_cast_3");
  });

  it("builds the interactive staff vote popup modal with all required form rows", () => {
    const modal = createStaffVoteModal();
    const json = modal.toJSON();

    expect(json.custom_id).toBe("staff_vote_modal");
    expect(json.title).toBe("Create Staff Vote");
    expect(json.components).toHaveLength(5);

    // Row 0: Question / Title
    expect((json.components[0] as any).components[0].custom_id).toBe("vote_title");
    expect((json.components[0] as any).components[0].required).toBe(true);

    // Row 1: Description
    expect((json.components[1] as any).components[0].custom_id).toBe("vote_description");
    expect((json.components[1] as any).components[0].required).toBe(false);

    // Rows 2-4: Options 1, 2, 3
    expect((json.components[2] as any).components[0].custom_id).toBe("vote_opt1");
    expect((json.components[3] as any).components[0].custom_id).toBe("vote_opt2");
    expect((json.components[4] as any).components[0].custom_id).toBe("vote_opt3");
  });

  it("parses state from embed and handles round-trip serialization", () => {
    const initialState: StaffVoteState = {
      title: "Should we accept PlayerA 100% on Kocmoc?",
      description: "Raw footage provided with microphone clicks.",
      isClosed: false,
      creatorId: "111222333",
      options: [
        { index: 0, emoji: "1️⃣", name: "Accept Run", voters: ["user_1", "user_2"] },
        { index: 1, emoji: "2️⃣", name: "Reject Run", voters: ["user_3"] },
      ],
      totalVotes: 3,
    };

    const embed = buildStaffVoteEmbed(initialState);
    const json = embed.toJSON();

    const parsed = parseStaffVoteState(json);
    expect(parsed).not.toBeNull();
    expect(parsed?.title).toBe("Should we accept PlayerA 100% on Kocmoc?");
    expect(parsed?.creatorId).toBe("111222333");
    expect(parsed?.isClosed).toBe(false);
    expect(parsed?.totalVotes).toBe(3);
    expect(parsed?.options[0].name).toBe("Accept Run");
    expect(parsed?.options[0].voters).toEqual(["user_1", "user_2"]);
    expect(parsed?.options[1].name).toBe("Reject Run");
    expect(parsed?.options[1].voters).toEqual(["user_3"]);
  });

  it("formats closed poll with clear winner announcement", () => {
    const closedState: StaffVoteState = {
      title: "Level Placement Decision",
      description: "Discussion on CBF jump timing.",
      isClosed: true,
      creatorId: "111222333",
      options: [
        { index: 0, emoji: "1️⃣", name: "Place at #1", voters: ["u1", "u2", "u3", "u4"] },
        { index: 1, emoji: "2️⃣", name: "Place at #2", voters: ["u5"] },
      ],
      totalVotes: 5,
    };

    const embed = buildStaffVoteEmbed(closedState);
    const json = embed.toJSON();

    expect(json.title).toContain("[CLOSED]");
    expect(json.description).toContain("Winning Outcome:");
    expect(json.description).toContain("Place at #1");
    expect(json.description).toContain("4");
    expect(json.description).toContain("80%");

    const disabledComponents = buildStaffVoteComponents(closedState.options, true);
    for (const row of disabledComponents) {
      for (const btn of row.components) {
        expect(btn.toJSON().disabled).toBe(true);
      }
    }
  });

  it("validates staff member roles and permissions accurately", () => {
    // Non-staff
    expect(isStaffMember({ roles: ["member-role"] }, null, "staff-role-id")).toBe(false);

    // Explicit staff role ID match in array
    expect(isStaffMember({ roles: ["staff-role-id"] }, null, "staff-role-id")).toBe(true);

    // Role named List Moderator in cache
    const mockModMember = {
      roles: {
        cache: [
          { id: "1", name: "Verified Member" },
          { id: "2", name: "🛡️ List Moderator" },
        ],
      },
    };
    expect(isStaffMember(mockModMember, null, "other-id")).toBe(true);

    // Guild Owner
    const mockGuild = { ownerId: "owner_123" };
    expect(isStaffMember({ user: { id: "owner_123" } }, mockGuild as any)).toBe(true);
    expect(isStaffMember({ user: { id: "stranger" } }, mockGuild as any)).toBe(false);
  });
});
