import fs from 'node:fs';
import path from 'node:path';
import { prompt } from 'enquirer';
import { v4 as uuidv4 } from 'uuid';
import { WJMAX_BUTTON_TYPES, WJMAX_LEVELS } from './constants';
import { ffmpeg } from './ffmpeg';
import { sleep } from './utils';

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
  creationTime: string;
}

interface TrackResult {
  levelInfo: Record<string, LevelInfo>;
}

async function main() {
  try {
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

    for (const level of levels) {
      if (!level.fileName) {
        continue;
      }

      const id = uuidv4();
      const targetFiles = files.filter((file) => file.name === level.fileName);
      let creationTime = '';

      for (const targetFile of targetFiles) {
        if (targetFile.extension === '.mp4') {
          const ffmpegCommand = ffmpeg(path.join(currentPath, targetFile.fullName));
          const ffprobeData = await ffmpegCommand.ffprobe();

          creationTime = ffprobeData.format.tags?.creation_time.toString() ?? '';
        }

        const oldPath = path.join(currentPath, targetFile.fullName);
        const newPath = path.join(currentPath, `${id}${targetFile.extension}`);

        fs.renameSync(oldPath, newPath);
      }

      trackResult.levelInfo[id] = {
        id,
        originalFileName: level.fileName,
        videoTitle: `【WJMAX】 ${singer} — ${songTitle} [${buttonType} ${level.level}] PERFECT PLAY`,
        creationTime,
      };
    }

    fs.writeFileSync(path.join(currentPath, 'yt-manager.json'), JSON.stringify(trackResult, null, 2));
  }
  catch (error) {
    console.error(error);

    while (true) {
      await sleep(1000);
    }
  }
}

main();
