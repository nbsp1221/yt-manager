import fs from 'node:fs';
import path from 'node:path';
import { prompt } from 'enquirer';
import { v4 as uuidv4 } from 'uuid';
import { WJMAX_LEVELS } from './constants';

const currentPath = process.cwd();

interface PromptResponse {
  messiFileName: string;
  angelFileName: string;
  wakgoodFileName: string;
  minsuFileName: string;
}

interface LevelInfo {
  id: string;
  originalFileName: string;
}

interface TrackResult {
  levelInfo: Record<string, LevelInfo>;
}

async function main() {
  const files = fs
    .readdirSync(currentPath)
    .filter((file) => !file.includes('yt-manager'))
    .map((file) => ({
      fullName: file,
      name: path.basename(file, path.extname(file)),
      extension: path.extname(file),
    }));

  const uniqueFileNames = [...new Set(files.map((file) => file.name))];

  const promptResponse = await prompt<PromptResponse>(
    WJMAX_LEVELS.map((level) => ({
      type: 'select',
      name: `${level.toLowerCase()}FileName`,
      message: `Select a filename for ${level} level`,
      choices: ['<None>', ...uniqueFileNames],
      result: (value) => value === '<None>' ? '' : value,
    }))
  );

  const levelFileNames = [
    promptResponse.messiFileName,
    promptResponse.angelFileName,
    promptResponse.wakgoodFileName,
    promptResponse.minsuFileName,
  ];

  const trackResult: TrackResult = {
    levelInfo: {},
  };

  levelFileNames.forEach((levelFileName) => {
    if (!levelFileName) {
      return;
    }

    const id = uuidv4();

    files.filter((file) => file.name === levelFileName).forEach((file) => {
      const oldPath = path.join(currentPath, file.fullName);
      const newPath = path.join(currentPath, `${id}${file.extension}`);

      fs.renameSync(oldPath, newPath);
    });

    trackResult.levelInfo[id] = {
      id,
      originalFileName: levelFileName,
    };
  });

  fs.writeFileSync(path.join(currentPath, 'yt-manager.json'), JSON.stringify(trackResult, null, 2));
}

main();
