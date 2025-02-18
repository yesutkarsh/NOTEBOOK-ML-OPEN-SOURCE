# 🎙️ NOTEBOOK ML WITH NODE JS OPEN SOURCE

An open-source project that dynamically generates AI-driven podcast-style conversations using **Google Cloud Text-to-Speech** (SSML), saves audio files, and combines them into a final podcast episode.

## ✨ Features

- 🔹 **Text-to-Speech Conversion**: Generates natural conversations using Google Cloud's Studio voices. [Right now hardcoded but you can use llm to dynamically generate data]
- 🔹 **SSML Markup**: Enhances speech with pauses, intonations, and expressive tones.
- 🔹 **Dynamic Audio Processing**: Saves each segment as an individual file.
- 🔹 **Final Podcast Compilation**: Merges all generated audio into a single **final.mp3**.
- 🔹 **Firebase Integration**: Automatically uploads the final podcast (Not detailed here). [Working on client side too]

---

## 📂 Project Structure

```plaintext
📁 server/
 ├── 📁 public/
 │    ├── 📁 audio/           # Stores all generated MP3 files
 │    │    ├── 1.mp3
 │    │    ├── 2.mp3
 │    │    ├── ...
 │    │    ├── final.mp3     # The combined podcast
 │
 ├── 📁 routes/
 │    ├── generate.js        # Main script for generating & combining audio
 │
 ├── 📁 config/
 │    ├── google-credentials.json # Google Cloud authentication
 │
 ├── package.json            # Dependencies
 ├── server.js               # Express API server
```

---

## ⚙️ How It Works

### 1️⃣ Generate AI-Driven Speech
The conversation is structured in an array, where **male** and **female** AI voices interact using **SSML-enhanced speech**.

```javascript
const conversationData = [
  {
    male: '<speak>Hey! <break time="0.3s"/> Have you heard about AI-driven learning?</speak>',
    female: '<speak>Hmm, sounds interesting! Tell me more.</speak>'
  },
  ...
];
```

Each segment is processed using Google Cloud **Text-to-Speech** and saved as an MP3 file in `/public/audio/`.

---

### 2️⃣ Combining Audio Files
Once all audio segments are successfully generated, they are merged into a single **final.mp3**.

```javascript
const command = `ffmpeg -f concat -safe 0 -i "${fileListPath}" -c copy "${finalFilePath}"`;
exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('Error combining audio:', error);
  } else {
    console.log('Final podcast created:', finalFilePath);
  }
});
```

📌 **Ensure FFmpeg is installed** for this process to work.

---

### 3️⃣ 🎧 Enjoy Your AI Podcast!
After completion, you can access your full AI-powered podcast in:

```
/public/audio/final.mp3
```

---

## 🛠️ Setup & Run
### Install Dependencies
```bash
npm install
```

### Start the Server
```bash
node server.js
```

### Generate Podcast
Hit the API endpoint:
```http
GET /generate-all
```

---

## 🚀 Contributions & Improvements
This project is **open-source** and welcomes contributions! Feel free to add new features, improve SSML markup, or optimize audio merging.

Happy coding! 🎵
