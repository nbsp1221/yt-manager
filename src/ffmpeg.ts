import originalFfmpeg, { type FfprobeData } from 'fluent-ffmpeg';

export function ffmpeg(path: string) {
  const ffmpegCommand = originalFfmpeg(path);

  const ffprobe = async () => {
    return new Promise<FfprobeData>((resolve, reject) => {
      ffmpegCommand.ffprobe((error, data) => {
        if (error) {
          reject(error);
        }
        else {
          resolve(data);
        }
      });
    });
  };

  return {
    ffprobe,
  };
}
