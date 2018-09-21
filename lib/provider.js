'use babel';

// Copyright 2018  Ternaris.
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import path from 'path';
import { parseString } from 'xml2js';



const errorMatch = [
  '(?<file>.+):(?<line>\\d+):(?<column>\\d+):\\s+(.*\\s+)?error:\\s+(?<message>.+)',
];

const warningMatch = [
  '(?<file>.+):(?<line>\\d+):(?<column>\\d+):\\s+(.*\\s+)?warning:\\s+(?<message>.+)',
];



function parseStringAsync(string) {
  return new Promise((resolve, reject) => {
    parseString(string, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

    

function findWsRoot(dir) {
  if (dir === '/') {
    return null;
  }
  if (fs.existsSync(path.join(dir, 'build', 'COLCON_IGNORE'))) {
    return dir;
  }
  return findWsRoot(path.dirname(dir));
}



export function provideBuilder() {
  return class ColconBuilder {
    constructor(cwd) {
      this.cwd = cwd;
    }

    destructor() {
      return 'void';
    }

    getNiceName() {
      return 'Build with colcon';
    }

    isEligible() {
      if (!fs.existsSync(path.join(this.cwd, 'package.xml'))) {
        return false;
      }

      const ws = findWsRoot(this.cwd);
      this.ws = ws;
      return !!ws;
    }

    async settings() {
      const xml = fs.readFileSync(path.join(this.cwd, 'package.xml'));
      const dom = await parseStringAsync(xml);
      const pkgname = dom.package.name[0];
      return [{
        name: 'Build with colcon',
        cwd: this.ws,
        exec: 'colcon build',
        args: ['--packages-select', pkgname],
        errorMatch,
        warningMatch,
      }];
    }

    on(event, cb) {
      return 'void';
    }

    removeAllListeners(event) {
      return 'void';
    }
  }
}
