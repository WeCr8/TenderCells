/**
 * SCAFFOLD TEST PLAN.
 * Prefer using the repo's existing fakeHub/connect helpers or extracting them into a shared test helper.
 *
 * Required assertions:
 * - new v2 tools are present and readOnlyHint === true;
 * - list_missions returns exactly the current generated Builder missions;
 * - list_builder_projects includes the current three projects;
 * - get_builder_step returns exactly one step + previous/next;
 * - concept project remains concept;
 * - learner depth changes returned wording but not step id/action;
 * - hosted mode never exposes emergency_stop/request_action/confirm_action;
 * - existing v0.3 read tools remain present.
 */
