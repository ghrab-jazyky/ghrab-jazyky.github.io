#!/usr/bin/env node
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const json = relative => JSON.parse(read(relative));
const policy = json('data/test-mode-policy.json');
const catalog = json('data/cards.json');
const release = json('version.json');

test('R22 remains a static-only design; neither secure grades nor student accounts can be activated', () => {
 assert.equal(policy.kind, 'LSH_STATIC_ASSESSMENT_POLICY_R22_V1');
 assert.equal(policy.deployment, 'GITHUB_PAGES_STATIC_ONLY');
 assert.equal(policy.status, 'PUBLIC_LOCAL_GRADE_PROPOSALS');
 for (const flag of [
  'backendEnabled', 'gradedTestsEnabled', 'officialGradesEnabled',
  'studentAccountsEnabled', 'centralResultCollectionEnabled',
  'clientAnswerKeySecrecyGuaranteed', 'tamperProofResultsGuaranteed'
 ]) assert.equal(policy[flag], false, flag + ' must stay false');
 assert.equal(policy.testUiEnabled, true);
 assert.equal(policy.selfCheckEnabled, true);
 assert.equal(policy.publication.officialClassificationForbidden, true);
 assert.equal(catalog.gradedTestsEnabled, false);
 assert.equal(release.gradedTestsEnabled, false);
 assert.equal(release.mode, 'public_practice_and_unverified_grade_proposals');
 assert.equal(release.version, 'R29');
});

test('R22 local self-check is planned for Reading/Listening only and cannot be called anti-cheat', () => {
 assert.deepEqual(policy.enabledPracticeSkills, ['konverzace', 'cteni', 'poslech']);
 assert.deepEqual(policy.plannedLocalSelfCheckSkills, ['cteni', 'poslech']);
 assert.deepEqual(policy.forbiddenSelfCheckSkills, ['konverzace']);
 const p = policy.futureSelfCheck;
 assert.equal(p.languageLevelFixedInStudentUi, true);
 assert.equal(p.dictionaryEnabled, false);
 assert.equal(p.myVocabularyEnabled, false);
 assert.equal(p.feedbackBeforeSubmission, false);
 assert.equal(p.localOneSubmissionUiRule, true);
 assert.equal(p.submissionsCannotBeServerVerified, true);
 assert.equal(p.resultStorage, 'STUDENT_DEVICE_ONLY');
 assert.equal(p.openAnswersRequireTeacherReview, true);
 assert.equal(p.showOfficialGradeBeforeApproval, false);
 assert.equal(p.teacherControlledListening, true);
 assert.equal(p.listeningPasses, 2);
 assert.deepEqual(p.listeningSections, [
  'first-listening', 'listen-and-interpret', 'listen-write-and-reconstruct'
 ]);
});

test('R22 does not modify 29 live practice cards or the 642 published variants', () => {
 assert.equal(catalog.entries.length, 29);
 assert.equal(release.topicCount, 29);
 assert.equal(release.variantCount, 642);
 const counts = {konverzace:0,cteni:0,poslech:0};
 let variants = 0;
 for (const entry of catalog.entries) {
  assert.ok(Object.hasOwn(counts, entry.skill), 'Unknown skill: ' + entry.skill);
  counts[entry.skill]++;
  variants += entry.languages.length * entry.levels.length;
  const content = fs.readFileSync(path.join(root, entry.relative));
  const digest = createHash('sha256').update(content).digest('hex');
  assert.equal(digest, release.contentHashes[entry.id], entry.id + ' changed unexpectedly');
  if (entry.skill === 'poslech') assert.deepEqual(entry.languages, ['en']);
 }
 assert.deepEqual(counts, {konverzace:21,cteni:5,poslech:3});
 assert.equal(variants, 642);
});

test('R22 public catalog offers practice sharing and only explicit ungraded tests', () => {
 const html = read('index.html');
 const js = read('assets/hub.js');
 assert.match(html, /Nejde o zabezpečený klasifikovaný test/);
 assert.match(html, /Uzamčení je pouze v uživatelském rozhraní/);
 assert.match(js, /Otevřít aktivitu/);
 assert.match(js, /Sdílet se studenty/);
 assert.match(js,/Test – známka 1–5/);
 assert.match(js,/if\(localSelfCheck&&\['cteni','poslech'\]/);
 assert.doesNotMatch(html + js, /LSH_TEST_GRADED_ENABLED|verifiedSchoolGrade/);
});

test('R22 documentation states the irreducible absence of server-side answer secrecy', () => {
 const spec = read('docs/R22-STATIC-ONLY-DECISION.md');
 assert.match(spec, /NO-GO/);
 assert.match(spec, /Statická aplikace nemůže současně/);
 assert.match(spec, /Samostatný test/);
 assert.match(spec, /R23/);
 assert.match(spec, /R24/);
 assert.match(spec, /R25/);
});
