import fs from 'node:fs';
import path from 'node:path';
import { prompt } from 'enquirer';
import { v4 as uuidv4 } from 'uuid';
import { WJMAX_BUTTON_TYPES, WJMAX_LEVELS } from './constants';

const currentPath = process.cwd();

interface PromptResponse {
  songTitle: string;
  singer: string;
  buttonType: string;
  messiFileName: string;
  angelFileName: string;
  wakgoodFileName: string;
  minsuFileName: string;
}

interface LevelInfo {
  id: string;
  originalFileName: string;
  videoTitle: string;
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

  const promptResponse = await prompt<PromptResponse>([
    {
      type: 'input',
      name: 'songTitle',
      message: 'Enter a song title',
    },
    {
      type: 'input',
      name: 'singer',
      message: "Enter a singer's name",
    },
    {
      type: 'select',
      name: 'buttonType',
      message: 'Select the type of button',
      choices: WJMAX_BUTTON_TYPES,
    },
    ...WJMAX_LEVELS.map((level) => ({
      type: 'select',
      name: `${level.toLowerCase()}FileName`,
      message: `Select the filename for ${level} level`,
      choices: ['<None>', ...uniqueFileNames],
      result: (value: string) => value === '<None>' ? '' : value,
    })),
  ]);

  const {
    songTitle,
    singer,
    buttonType,
    messiFileName,
    angelFileName,
    wakgoodFileName,
    minsuFileName,
  } = promptResponse;

  const levels = [
    { level: WJMAX_LEVELS[0], fileName: messiFileName },
    { level: WJMAX_LEVELS[1], fileName: angelFileName },
    { level: WJMAX_LEVELS[2], fileName: wakgoodFileName },
    { level: WJMAX_LEVELS[3], fileName: minsuFileName },
  ];

  const trackResult: TrackResult = {
    levelInfo: {},
  };

  levels.forEach((level) => {
    if (!level.fileName) {
      return;
    }

    const id = uuidv4();

    files.filter((file) => file.name === level.fileName).forEach((file) => {
      const oldPath = path.join(currentPath, file.fullName);
      const newPath = path.join(currentPath, `${id}${file.extension}`);

      fs.renameSync(oldPath, newPath);
    });

    trackResult.levelInfo[id] = {
      id,
      originalFileName: level.fileName,
      videoTitle: `【WJMAX】 ${singer} — ${songTitle} [${buttonType} ${level.level}] PERFECT PLAY`,
    };
  });

  fs.writeFileSync(path.join(currentPath, 'yt-manager.json'), JSON.stringify(trackResult, null, 2));
}

main();
