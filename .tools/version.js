import {readdirSync} from 'fs';
import findLast from 'lodash/collection/findLast';

// List versions
export const list = readdirSync('.').filter((file) => /^draft-\d+$/.test(file) || /^legacy$/.test(file));
// Determine version
export const get = (v) => /^latest*/.test(v) ? (findLast(list, (v) => /^draft-\d+$/.test(v))) : v;
// Latest version
export const latest = get('latest');