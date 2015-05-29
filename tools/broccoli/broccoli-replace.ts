import fs = require('fs');
import fse = require('fs-extra');
import path = require('path');
import {wrapDiffingPlugin, DiffingBroccoliPlugin, DiffResult} from './diffing-broccoli-plugin';

var minimatch = require('minimatch');
var exec = require('child_process').exec;

/**
 * Intercepts each changed file and replaces its contents with
 * the associated changes.
 */
class BrocReplace implements DiffingBroccoliPlugin {
  constructor(private inputPath, private cachePath, private options) {}

  rebuild(treeDiff: DiffResult) {
    var patterns = this.options.patterns;
    var files = this.options.files;

    treeDiff.changedPaths.forEach((changedFilePath) => {
      var sourceFilePath = path.join(this.inputPath, changedFilePath)
      var destFilePath = path.join(this.cachePath, changedFilePath);
      var destDirPath = path.dirname(destFilePath);

      if (!fs.existsSync(destDirPath)) {
        fse.mkdirpSync(destDirPath);
      }

      var fileMatches = files.some((filePath) => minimatch(changedFilePath, filePath));
      if (fileMatches) {
        var content = fs.readFileSync(sourceFilePath, 'utf8');
        patterns.forEach((pattern) => {
          content = content.replace(pattern.match, pattern.replacement);
        });
        fs.writeFileSync(destFilePath, content);
      } else {
        fs.symlinkSync(sourceFilePath, destFilePath);
      }
    });

    treeDiff.removedPaths.forEach((removedFilePath) => {
      var destFilePath = path.join(this.cachePath, removedFilePath);
      fs.unlinkSync(destFilePath);
    });
  }
}

export default wrapDiffingPlugin(BrocReplace);
