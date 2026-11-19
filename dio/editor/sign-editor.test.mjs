import assert from 'node:assert/strict';
import { initial, History } from './model.js';
import { configureSign, dimensions, prepareProject, validate } from './sign-editor.js';

let checks = 0;
function check(action) {
  action();
  checks += 1;
}

const tall = { box: [0, 0, 150, 500] };
const round = { box: [0, 0, 500, 500] };
check(() => assert.deepEqual(dimensions({ kind: 'asset' }, tall), { width: 180, height: 600 }));
check(() => assert.deepEqual(dimensions({ kind: 'asset' }, round), { width: 600, height: 600 }));
const project = initial();
prepareProject(project, () => 'new');
const sign = configureSign({ kind: 'text', text: 'TEST', widthMm: 9 }, null, 'existing');
project.scene.poles.push({ id: 'pole', x: 0, y: 0, angle: 0, signs: [sign] });
check(() => assert.equal(validate(project), project));
check(() => assert.equal(project.scene.poles[0].signs[0].phase, 'existing'));
const history = new History(project.scene);
sign.phase = 'new';
history.commit(project.scene);
check(() => assert.equal(history.step(-1).poles[0].signs[0].phase, 'existing'));
check(() => assert.equal(history.step(1).poles[0].signs[0].phase, 'new'));
sign.physicalWidthMm = -1;
check(() => assert.throws(() => validate(project)));
sign.physicalWidthMm = 500;
check(() => assert.doesNotThrow(() => validate(project)));
const legacy = initial();
legacy.scene.poles.push({ id: 'old', x: 1, y: 2, angle: 0, signs: [
  { kind: 'speed', text: '30', widthMm: 9 }
] });
prepareProject(legacy, () => 'existing');
check(() => assert.equal(legacy.scene.poles[0].signs[0].physicalWidthMm, 600));
check(() => assert.equal(legacy.scene.poles[0].signs[0].phase, 'existing'));
check(() => assert.doesNotThrow(() => validate(legacy)));
prepareProject(legacy, () => { throw new Error('Must not ask twice'); });
check(() => assert.equal(legacy.scene.signSchema, 2));
const invalid = structuredClone(legacy);
invalid.scene.poles[0].signs[0].phase = 'invalid';
check(() => assert.throws(() => validate(invalid)));
const cancelled = initial();
cancelled.scene.poles = structuredClone(legacy.scene.poles);
check(() => assert.throws(() => prepareProject(cancelled, () => null)));
const saved = JSON.parse(JSON.stringify(legacy));
check(() => assert.equal(validate(saved).scene.poles[0].signs[0].phase, 'existing'));
console.log(JSON.stringify({ checks, status: 'passed' }));
