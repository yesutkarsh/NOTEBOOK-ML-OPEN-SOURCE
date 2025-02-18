const express = require('express');
const router = express.Router();
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs').promises;
const path = require('path');
// Use execFile instead of exec and load ffmpeg-static for cross-platform compatibility
const { execFile } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const client = new textToSpeech.TextToSpeechClient({
  keyFilename: path.join(__dirname, '../config/google-credentials.json'),
});

// Sample conversation data (each segment has a male and a female SSML entry)
const conversationData = [
  {
    male: `<speak>
              Hello everyone, welcome to our podcast episode! I'm James, your host.
              <break time="0.3s"/> Today, we'll explore innovative AI in education.
            </speak>`,
    female: `<speak>
                <voice name="en-US-Studio-O" fundamentalFrequency="130Hz">
                  Hi, I'm Emily, your co-host. Let's dive right in!
                </voice>
            </speak>`
  },
  {
    male: `<speak>
              Our project began with a vision to revolutionize learning.
              <break time="0.3s"/> It adapts in real time to each learner's needs.
            </speak>`,
    female: `<speak>
                <voice name="en-US-Studio-O" fundamentalFrequency="135Hz">
                  Exactly, James. Early brainstorming sessions really set the stage.
                </voice>
            </speak>`
  },
  // Add additional segments here as needed to reach the desired runtime
];

// Helper function to combine all generated MP3 files into one final MP3 file using ffmpeg-static
async function combineAudioFiles(audioDir) {
  const fileListPath = path.join(audioDir, 'filelist.txt');
  let files = await fs.readdir(audioDir);
  // Filter out non-MP3 files and exclude the final file if it exists
  files = files.filter(file => file.endsWith('.mp3') && file !== 'final.mp3');
  // Sort files numerically (assuming filenames like "1.mp3", "2.mp3", etc.)
  files.sort((a, b) => parseInt(a) - parseInt(b));

  // Create the file list required by ffmpeg
  let fileListContent = '';
  for (const file of files) {
    fileListContent += `file '${path.join(audioDir, file)}'\n`;
  }
  await fs.writeFile(fileListPath, fileListContent, 'utf-8');

  const finalFilePath = path.join(audioDir, 'final.mp3');
  // Build ffmpeg arguments array
  const ffmpegArgs = ['-f', 'concat', '-safe', '0', '-i', fileListPath, '-c', 'copy', finalFilePath];
  
  return new Promise((resolve, reject) => {
    execFile(ffmpegPath, ffmpegArgs, (error, stdout, stderr) => {
      if (error) {
        console.error('Error combining audio files:', stderr);
        return reject(error);
      }
      // Optionally, delete the temporary file list
      fs.unlink(fileListPath).catch(err => console.error('Error deleting file list:', err));
      resolve(finalFilePath);
    });
  });
}

// GET route to generate and combine audio files
router.get('/generate-all', async (req, res) => {
  try {
    const audioDir = path.join(__dirname, '../public/audio');
    await fs.mkdir(audioDir, { recursive: true });
    
    // Clear existing files in the audio folder
    const existingFiles = await fs.readdir(audioDir);
    for (const file of existingFiles) {
      await fs.unlink(path.join(audioDir, file));
    }
    
    let fileIndex = 1;
    const results = [];
    
    // Loop through each dialogue segment and generate male and female audio files
    for (const dialog of conversationData) {
      // Male voice synthesis using Studio voice
      const maleVoiceParams = {
        languageCode: 'en-US',
        name: 'en-US-Studio-M',
        ssmlGender: 'MALE'
      };

      const maleRequest = {
        input: { ssml: dialog.male },
        voice: maleVoiceParams,
        audioConfig: {
          audioEncoding: 'MP3',
          pitch: 0,
          speakingRate: 1,
          volumeGainDb: 2,
          effectsProfileId: ['large-home-entertainment-class-device'],
          timeoutSeconds: 120
        },
      };

      const [maleResponse] = await client.synthesizeSpeech(maleRequest);
      const maleFileName = `${fileIndex}.mp3`;
      await fs.writeFile(path.join(audioDir, maleFileName), maleResponse.audioContent, 'binary');
      fileIndex++;

      // Female voice synthesis using Studio voice
      const femaleVoiceParams = {
        languageCode: 'en-US',
        name: 'en-US-Studio-O',
        ssmlGender: 'FEMALE'
      };

      const femaleRequest = {
        input: { ssml: dialog.female },
        voice: femaleVoiceParams,
        audioConfig: {
          audioEncoding: 'MP3',
          pitch: 0,
          speakingRate: 1,
          volumeGainDb: 2,
          effectsProfileId: ['large-home-entertainment-class-device'],
          timeoutSeconds: 120
        },
      };

      const [femaleResponse] = await client.synthesizeSpeech(femaleRequest);
      const femaleFileName = `${fileIndex}.mp3`;
      await fs.writeFile(path.join(audioDir, femaleFileName), femaleResponse.audioContent, 'binary');
      fileIndex++;

      results.push({
        male: {
          text: dialog.male,
          audioPath: `/audio/${maleFileName}`
        },
        female: {
          text: dialog.female,
          audioPath: `/audio/${femaleFileName}`
        }
      });
    }
    
    // Combine all individual audio files into one final file named "final.mp3"
    const finalFile = await combineAudioFiles(audioDir);

    res.json({
      message: 'Audio files generated and combined successfully',
      combinedAudioPath: `/audio/${path.basename(finalFile)}`,
      results
    });

  } catch (error) {
    console.error('Error generating and combining audio:', error);
    res.status(500).json({ 
      error: 'Failed to generate and combine audio files',
      details: error.message
    });
  }
});

module.exports = router;
