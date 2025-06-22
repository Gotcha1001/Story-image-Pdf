// "use client";
// import Link from "next/link";
// import { useState, useRef } from "react";

// export default function Home() {
//   const [formData, setFormData] = useState({
//     storyPrompt: "",
//     imagePrompt: "",
//     ttsPrompt: "",
//   });
//   const [results, setResults] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [isRecording, setIsRecording] = useState(false);
//   const mediaRecorderRef = useRef(null);
//   const audioChunksRef = useRef([]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!formData.storyPrompt.trim()) {
//       alert("Please enter a story prompt.");
//       return;
//     }
//     if (loading || isRecording) return;
//     setLoading(true);
//     setError(null);

//     try {
//       // Prepare result object with fixed filenames
//       const result = {
//         story: null,
//         storyStatus: "Failed to generate story.",
//         storyBaseName: "story.txt",
//         imageData: null,
//         imageStatus: "Failed to generate image.",
//         imageBaseName: "image.png",
//         audioData: null,
//         audioMimeType: null,
//         audioBaseName: null,
//         audioStatus: "Failed to generate audio.",
//         error: null,
//       };

//       // Call /api/generate for story
//       const generateRes = await fetch("/api/generate", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           storyPrompt: formData.storyPrompt,
//         }),
//       });
//       if (!generateRes.ok)
//         throw new Error(`HTTP error! Status: ${generateRes.status}`);
//       const generateData = await generateRes.json();
//       console.log("Generate API Response:", generateData);

//       // Update result with story
//       result.story = generateData.story;
//       result.storyStatus = generateData.storyStatus;
//       result.storyBaseName = generateData.storyBaseName;
//       if (generateData.error) {
//         result.error = generateData.error;
//       }

//       // Call /api/query for image if imagePrompt is provided
//       if (formData.imagePrompt.trim()) {
//         const queryRes = await fetch("/api/query", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ prompt: formData.imagePrompt }),
//         });
//         if (!queryRes.ok)
//           throw new Error(`HTTP error! Status: ${queryRes.status}`);
//         const queryData = await queryRes.json();
//         console.log("Query API Response:", queryData);

//         if (queryData.image) {
//           result.imageData = queryData.image;
//           result.imageStatus = "Image generated successfully";
//         } else if (queryData.error) {
//           result.imageStatus = `Failed to generate image: ${queryData.error}`;
//           result.error = result.error
//             ? `${result.error}; Image error: ${queryData.error}`
//             : queryData.error;
//         }
//       } else {
//         result.imageStatus = "No image prompt provided";
//       }

//       // Browser-based text-to-speech and recording
//       const ttsInput = formData.ttsPrompt || result.story;
//       if (ttsInput) {
//         try {
//           console.log("TTS Input:", ttsInput); // Debug TTS input
//           const utterance = new SpeechSynthesisUtterance(ttsInput);
//           utterance.lang = "en-US";
//           utterance.volume = 1;
//           utterance.rate = 1;
//           utterance.pitch = 1;

//           // Request microphone permission to capture system audio
//           const stream = await navigator.mediaDevices.getUserMedia({
//             audio: true,
//           });
//           const audioContext = new (window.AudioContext ||
//             window.webkitAudioContext)();
//           const source = audioContext.createMediaStreamSource(stream);
//           const destination = audioContext.createMediaStreamDestination();
//           source.connect(destination);

//           // Use fallback mimeType for MediaRecorder
//           const mimeType = MediaRecorder.isTypeSupported("audio/webm")
//             ? "audio/webm"
//             : "audio/mp3";
//           console.log("Selected MediaRecorder mimeType:", mimeType);
//           mediaRecorderRef.current = new MediaRecorder(destination.stream, {
//             mimeType,
//           });
//           audioChunksRef.current = [];

//           mediaRecorderRef.current.ondataavailable = (event) => {
//             if (event.data.size > 0) {
//               audioChunksRef.current.push(event.data);
//               console.log("Audio chunk size:", event.data.size); // Debug chunk size
//             } else {
//               console.log("Empty audio chunk received");
//             }
//           };

//           mediaRecorderRef.current.onstop = () => {
//             const audioBlob = new Blob(audioChunksRef.current, {
//               type: mimeType,
//             });
//             const reader = new FileReader();
//             reader.readAsDataURL(audioBlob);
//             reader.onloadend = () => {
//               const base64String = reader.result.split(",")[1];
//               const audioExtension = mimeType.split("/")[1];
//               const audioBaseName = `audio.${audioExtension}`;
//               const updatedResult = {
//                 ...result,
//                 audioData: base64String,
//                 audioMimeType: mimeType,
//                 audioBaseName: audioBaseName,
//                 audioStatus: "Audio generated successfully",
//               };
//               setResults(updatedResult);
//             };
//             setIsRecording(false);
//             stream.getTracks().forEach((track) => track.stop()); // Stop microphone
//             audioContext.close();
//           };

//           // Start recording
//           setIsRecording(true);
//           mediaRecorderRef.current.start();

//           // Play speech
//           window.speechSynthesis.speak(utterance);

//           // Stop recording when speech ends
//           utterance.onend = () => {
//             if (
//               mediaRecorderRef.current &&
//               mediaRecorderRef.current.state !== "inactive"
//             ) {
//               mediaRecorderRef.current.stop();
//             }
//           };
//         } catch (e) {
//           console.error("Audio generation error:", e);
//           result.audioStatus = `Failed to generate audio: ${e.message}`;
//           result.error = result.error
//             ? `${result.error}; Audio error: ${e.message}`
//             : e.message;
//           setIsRecording(false);
//         }
//       } else {
//         result.audioStatus = "No audio input provided";
//       }

//       if (!result.story && !result.imageData && !result.audioData) {
//         throw new Error("No valid data returned from APIs");
//       }

//       // Set initial results (audio will update later)
//       setResults(result);
//     } catch (err) {
//       console.error("Fetch error:", err);
//       setError(err.message || "Failed to generate content");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const createStoryBlobUrl = (story) => {
//     const blob = new Blob([story], { type: "text/plain" });
//     return URL.createObjectURL(blob);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-600 p-4">
//       <div className="max-w-6xl mx-auto">
//         <h1 className="text-4xl text-indigo-400 font-bold text-center mb-6 animate-pulse">
//           ✨ Story Creator ✨
//         </h1>
//         <p className="text-purple-100 text-center mb-8">
//           Transform your imagination into magical stories, stunning visuals, and
//           captivating audio
//         </p>
//         <form
//           onSubmit={handleSubmit}
//           className="bg-white/10 rounded-2xl p-6 shadow-lg"
//         >
//           {error && (
//             <div className="bg-red-500/20 text-red-100 p-3 rounded mb-4">
//               {error}
//             </div>
//           )}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//             {/* Story Section */}
//             <div className="space-y-4">
//               <label className="block text-purple-200">Story Prompt</label>
//               <textarea
//                 name="storyPrompt"
//                 value={formData.storyPrompt}
//                 onChange={handleInputChange}
//                 placeholder="Write a magical bedtime story..."
//                 className="w-full p-3 rounded-lg bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
//                 rows="4"
//               />
//             </div>
//             {/* Media Section */}
//             <div className="space-y-4">
//               <label className="block text-purple-200">Image Prompt</label>
//               <textarea
//                 name="imagePrompt"
//                 value={formData.imagePrompt}
//                 onChange={handleInputChange}
//                 placeholder="A majestic unicorn in a garden..."
//                 className="w-full p-3 rounded-lg bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
//                 rows="4"
//               />
//               <label className="block text-purple-200">Audio Narration</label>
//               <textarea
//                 name="ttsPrompt"
//                 value={formData.ttsPrompt}
//                 onChange={handleInputChange}
//                 placeholder="Customize narration (leave blank to use story text)..."
//                 className="w-full p-3 rounded-lg bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
//                 rows="3"
//               />
//             </div>
//           </div>
//           <button
//             type="submit"
//             disabled={loading || isRecording}
//             className="w-full mt-6 bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
//           >
//             {loading
//               ? "Creating..."
//               : isRecording
//               ? "Recording..."
//               : "Create Magic"}
//           </button>
//           {results && (
//             <div className="mt-6 space-y-4">
//               {results.story && (
//                 <div className="bg-white/10 p-3 rounded">
//                   <h3 className="text-white font-bold">Your Story</h3>
//                   <p className="text-white mt-2">{results.story}</p>
//                   <a
//                     href={createStoryBlobUrl(results.story)}
//                     download="story.txt"
//                     className="text-purple-300 hover:underline mt-2 inline-block"
//                   >
//                     Download Story 📥
//                   </a>
//                 </div>
//               )}
//               {results.imageData && (
//                 <div className="bg-white/10 p-3 rounded">
//                   <h3 className="text-white font-bold">Your Image</h3>
//                   <img
//                     src={`data:image/png;base64,${results.imageData}`}
//                     className="mt-2 rounded-lg w-full max-w-md"
//                     alt="Generated Image"
//                   />
//                   <a
//                     href={`data:image/png;base64,${results.imageData}`}
//                     download="image.png"
//                     className="text-purple-300 hover:underline mt-2 inline-block"
//                   >
//                     Download Image 📥
//                   </a>
//                 </div>
//               )}
//               {results.audioData && results.audioMimeType && (
//                 <div className="bg-white/10 p-3 rounded">
//                   <h3 className="text-white font-bold">Your Audio</h3>
//                   <audio
//                     controls
//                     src={`data:${results.audioMimeType};base64,${results.audioData}`}
//                     className="mt-2 w-full max-w-md"
//                   />
//                   <a
//                     href={`data:${results.audioMimeType};base64,${results.audioData}`}
//                     download={results.audioBaseName}
//                     className="text-purple-300 hover:underline mt-2 inline-block"
//                   >
//                     Download Audio 📥
//                   </a>
//                 </div>
//               )}
//               {results.error && <p className="text-red-500">{results.error}</p>}
//             </div>
//           )}
//         </form>
//       </div>
//     </div>
//   );
// }

// "use client";
// import Link from "next/link";
// import { useState, useRef } from "react";

// export default function Home() {
//   const [formData, setFormData] = useState({
//     storyPrompt: "",
//     imagePrompt: "",
//     ttsPrompt: "",
//   });
//   const [results, setResults] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [isRecording, setIsRecording] = useState(false);
//   const mediaRecorderRef = useRef(null);
//   const audioChunksRef = useRef([]);
//   const streamRef = useRef(null);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!formData.storyPrompt.trim()) {
//       alert("Please enter a story prompt.");
//       return;
//     }
//     if (loading || isRecording) return;
//     setLoading(true);
//     setError(null);

//     try {
//       // Prepare result object with fixed filenames
//       const result = {
//         story: null,
//         storyStatus: "Failed to generate story.",
//         storyBaseName: "story.pdf", // Updated to PDF
//         imageData: null,
//         imageStatus: "Failed to generate image.",
//         imageBaseName: "image.png",
//         audioData: null,
//         audioMimeType: null,
//         audioBaseName: null,
//         audioStatus: "Failed to generate audio.",
//         error: null,
//       };

//       // Call /api/generate for story
//       const generateRes = await fetch("/api/generate", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           storyPrompt: formData.storyPrompt,
//         }),
//       });
//       if (!generateRes.ok)
//         throw new Error(`HTTP error! Status: ${generateRes.status}`);
//       const generateData = await generateRes.json();
//       console.log("Generate API Response:", generateData);

//       // Update result with story
//       result.story = generateData.story;
//       result.storyStatus = generateData.storyStatus;
//       result.storyBaseName = generateData.storyBaseName || "story.pdf";
//       if (generateData.error) {
//         result.error = generateData.error;
//       }

//       // Call /api/query for image if imagePrompt is provided
//       if (formData.imagePrompt.trim()) {
//         const queryRes = await fetch("/api/query", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ prompt: formData.imagePrompt }),
//         });
//         if (!queryRes.ok)
//           throw new Error(`HTTP error! Status: ${queryRes.status}`);
//         const queryData = await queryRes.json();
//         console.log("Query API Response:", queryData);

//         if (queryData.image) {
//           result.imageData = queryData.image;
//           result.imageStatus = "Image generated successfully";
//         } else if (queryData.error) {
//           result.imageStatus = `Failed to generate image: ${queryData.error}`;
//           result.error = result.error
//             ? `${result.error}; Image error: ${queryData.error}`
//             : queryData.error;
//         }
//       } else {
//         result.imageStatus = "No image prompt provided";
//       }

//       // Browser-based text-to-speech and recording
//       const ttsInput = formData.ttsPrompt || result.story;
//       if (ttsInput) {
//         try {
//           console.log("TTS Input:", ttsInput); // Debug TTS input
//           const utterance = new SpeechSynthesisUtterance(ttsInput);
//           utterance.lang = "en-US";
//           utterance.volume = 1;
//           utterance.rate = 1;
//           utterance.pitch = 1;

//           // Request microphone permission to capture audio
//           const stream = await navigator.mediaDevices.getUserMedia({
//             audio: true,
//           });
//           streamRef.current = stream;
//           mediaRecorderRef.current = new MediaRecorder(stream, {
//             mimeType: "audio/webm",
//           });
//           audioChunksRef.current = [];

//           mediaRecorderRef.current.ondataavailable = (event) => {
//             if (event.data.size > 0) {
//               audioChunksRef.current.push(event.data);
//               console.log("Audio chunk size:", event.data.size); // Debug chunk size
//             } else {
//               console.log("Empty audio chunk received");
//             }
//           };

//           mediaRecorderRef.current.onstop = () => {
//             const audioBlob = new Blob(audioChunksRef.current, {
//               type: "audio/webm",
//             });
//             const reader = new FileReader();
//             reader.readAsDataURL(audioBlob);
//             reader.onloadend = () => {
//               const base64String = reader.result.split(",")[1];
//               const audioBaseName = "story_audio.webm";
//               const updatedResult = {
//                 ...result,
//                 audioData: base64String,
//                 audioMimeType: "audio/webm",
//                 audioBaseName: audioBaseName,
//                 audioStatus: "Audio generated successfully",
//               };
//               setResults(updatedResult);
//             };
//             setIsRecording(false);
//             if (streamRef.current) {
//               streamRef.current.getTracks().forEach((track) => track.stop());
//               streamRef.current = null;
//             }
//           };

//           mediaRecorderRef.current.onerror = (e) => {
//             console.error("MediaRecorder error:", e);
//             result.audioStatus = `Failed to generate audio: ${
//               e.error?.message || "Unknown error"
//             }`;
//             setIsRecording(false);
//             if (streamRef.current) {
//               streamRef.current.getTracks().forEach((track) => track.stop());
//               streamRef.current = null;
//             }
//             setResults(result);
//           };

//           // Start recording
//           setIsRecording(true);
//           mediaRecorderRef.current.start();
//           console.log("Recording started.");

//           // Play speech
//           utterance.onstart = () => {
//             console.log("Speech synthesis started.");
//           };

//           utterance.onend = () => {
//             console.log("Speech synthesis ended.");
//             setTimeout(() => {
//               if (
//                 mediaRecorderRef.current &&
//                 mediaRecorderRef.current.state === "recording"
//               ) {
//                 mediaRecorderRef.current.stop();
//                 console.log("Recording stopped.");
//               }
//             }, 1000); // Delay to capture trailing audio
//           };

//           utterance.onerror = (e) => {
//             console.error("Speech synthesis error:", e);
//             result.audioStatus = `Failed to generate audio: ${
//               e.error?.message || "Speech synthesis failed"
//             }`;
//             setResults(result);
//             if (
//               mediaRecorderRef.current &&
//               mediaRecorderRef.current.state === "recording"
//             ) {
//               mediaRecorderRef.current.stop();
//             }
//             setIsRecording(false);
//           };

//           window.speechSynthesis.speak(utterance);
//           console.log("Speech synthesis initiated.");
//         } catch (e) {
//           console.error("Audio generation error:", e);
//           result.audioStatus = `Failed to generate audio: ${e.message}`;
//           result.error = result.error
//             ? `${result.error}; Audio error: ${e.message}`
//             : e.message;
//           setIsRecording(false);
//           setResults(result);
//         }
//       } else {
//         result.audioStatus = "No audio input provided";
//         console.log("No valid audio input provided");
//       }

//       if (!result.story && !result.imageData && !result.audioData) {
//         throw new Error("No valid data returned from APIs");
//       }

//       // Set initial results (audio will update later)
//       setResults(result);
//     } catch (err) {
//       console.error("Fetch error:", err);
//       setError(err.message || "Failed to generate content");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const generateAndDownloadPDF = (story, imageData) => {
//     try {
//       const { jsPDF } = window.jspdf;
//       const doc = new jsPDF({
//         orientation: "portrait",
//         unit: "mm",
//         format: "a4",
//       });

//       // Styling variables
//       const marginLeft = 20;
//       const marginTop = 20;
//       const maxWidth = 170; // A4 width (210mm) - margins
//       const lineHeight = 7;
//       let currentY = marginTop;

//       // Add title
//       doc.setFont("times", "bold");
//       doc.setFontSize(20);
//       doc.setTextColor(75, 0, 130); // Indigo
//       doc.text("Your Magical Story", marginLeft, currentY);
//       currentY += 15;

//       // Add story text
//       const paragraphs = story.split("\n\n").filter((p) => p.trim());
//       doc.setFont("times", "normal");
//       doc.setFontSize(12);
//       doc.setTextColor(0, 0, 0); // Black

//       paragraphs.forEach((paragraph) => {
//         const lines = doc.splitTextToSize(paragraph.trim(), maxWidth);
//         doc.text(lines, marginLeft, currentY);
//         currentY += lines.length * lineHeight + 5; // Paragraph spacing
//         if (currentY > 260) {
//           // Near page bottom
//           doc.addPage();
//           currentY = marginTop;
//         }
//       });

//       // Add image if available
//       if (imageData) {
//         if (currentY > 200) {
//           // Ensure space for image
//           doc.addPage();
//           currentY = marginTop;
//         }
//         const imgWidth = 150;
//         const imgHeight = 150; // Assume square image for simplicity
//         const imgX = (210 - imgWidth) / 2; // Center image
//         doc.addImage(
//           `data:image/png;base64,${imageData}`,
//           "PNG",
//           imgX,
//           currentY,
//           imgWidth,
//           imgHeight
//         );
//       }

//       // Trigger direct download
//       doc.save("story.pdf");
//     } catch (err) {
//       console.error("PDF generation error:", err);
//       alert("Failed to generate PDF: " + err.message);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-600 p-4">
//       <div className="max-w-6xl mx-auto">
//         <h1 className="text-4xl text-indigo-400 font-bold text-center mb-6 animate-pulse">
//           ✨ Story Creator ✨
//         </h1>
//         <p className="text-purple-100 text-center mb-8">
//           Transform your imagination into magical stories, stunning visuals, and
//           captivating audio
//         </p>
//         <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
//         <form
//           onSubmit={handleSubmit}
//           className="bg-white/10 rounded-2xl p-6 shadow-lg"
//         >
//           {error && (
//             <div className="bg-red-500/20 text-red-100 p-3 rounded mb-4">
//               {error}
//             </div>
//           )}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//             {/* Story Section */}
//             <div className="space-y-4">
//               <label className="block text-purple-200">Story Prompt</label>
//               <textarea
//                 name="storyPrompt"
//                 value={formData.storyPrompt}
//                 onChange={handleInputChange}
//                 placeholder="Write a magical bedtime story..."
//                 className="w-full p-3 rounded-lg bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
//                 rows="4"
//               />
//             </div>
//             {/* Media Section */}
//             <div className="space-y-4">
//               <label className="block text-purple-200">Image Prompt</label>
//               <textarea
//                 name="imagePrompt"
//                 value={formData.imagePrompt}
//                 onChange={handleInputChange}
//                 placeholder="A majestic unicorn in a garden..."
//                 className="w-full p-3 rounded-lg bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
//                 rows="4"
//               />
//               <label className="block text-purple-200">Audio Narration</label>
//               <textarea
//                 name="ttsPrompt"
//                 value={formData.ttsPrompt}
//                 onChange={handleInputChange}
//                 placeholder="Customize narration (leave blank to use story text)..."
//                 className="w-full p-3 rounded-lg bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
//                 rows="3"
//               />
//             </div>
//           </div>
//           <button
//             type="submit"
//             disabled={loading || isRecording}
//             className="w-full mt-6 bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
//           >
//             {loading
//               ? "Creating..."
//               : isRecording
//               ? "Recording..."
//               : "Create Magic"}
//           </button>
//           {results && (
//             <div className="mt-6 space-y-4">
//               {results.story && (
//                 <div className="bg-white/10 p-3 rounded">
//                   <h3 className="text-white font-bold">Your Story</h3>
//                   <p className="text-white mt-2">{results.story}</p>
//                   <button
//                     onClick={() =>
//                       generateAndDownloadPDF(results.story, results.imageData)
//                     }
//                     className="text-purple-300 hover:underline mt-2 inline-block"
//                   >
//                     Download Story as PDF 📄
//                   </button>
//                 </div>
//               )}
//               {results.imageData && (
//                 <div className="bg-white/10 p-3 rounded">
//                   <h3 className="text-white font-bold">Your Image</h3>
//                   <img
//                     src={`data:image/png;base64,${results.imageData}`}
//                     className="mt-2 rounded-lg w-full max-w-md"
//                     alt="Generated Image"
//                   />
//                   <a
//                     href={`data:image/png;base64,${results.imageData}`}
//                     download="image.png"
//                     className="text-purple-300 hover:underline mt-2 inline-block"
//                   >
//                     Download Image 📥
//                   </a>
//                 </div>
//               )}
//               {results.audioData && results.audioMimeType && (
//                 <div className="bg-white/10 p-3 rounded">
//                   <h3 className="text-white font-bold">Your Audio</h3>
//                   <audio
//                     controls
//                     src={`data:${results.audioMimeType};base64,${results.audioData}`}
//                     className="mt-2 w-full max-w-md"
//                   />
//                   <a
//                     href={`data:${results.audioMimeType};base64,${results.audioData}`}
//                     download={results.audioBaseName}
//                     className="text-purple-300 hover:underline mt-2 inline-block"
//                   >
//                     Download Audio 📥
//                   </a>
//                 </div>
//               )}
//               {results.error && <p className="text-red-500">{results.error}</p>}
//             </div>
//           )}
//         </form>
//       </div>
//     </div>
//   );
// }

"use client";
import Link from "next/link";
import { useState, useRef } from "react";

export default function Home() {
  const [formData, setFormData] = useState({
    storyPrompt: "",
    imagePrompt: "",
    ttsPrompt: "",
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.storyPrompt.trim()) {
      alert("Please enter a story prompt.");
      return;
    }
    if (loading || isRecording) return;
    setLoading(true);
    setError(null);

    try {
      // Prepare result object with fixed filenames
      const result = {
        story: null,
        storyStatus: "Failed to generate story.",
        storyBaseName: "story.pdf",
        imageData: null,
        imageStatus: "Failed to generate image.",
        imageBaseName: "image.png",
        audioData: null,
        audioMimeType: null,
        audioBaseName: null,
        audioStatus: "Failed to generate audio.",
        error: null,
      };

      // Call /api/generate for story
      const generateRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyPrompt: formData.storyPrompt,
        }),
      });
      if (!generateRes.ok)
        throw new Error(`HTTP error! Status: ${generateRes.status}`);
      const generateData = await generateRes.json();
      console.log("Generate API Response:", generateData);

      // Update result with story
      result.story = generateData.story;
      result.storyStatus = generateData.storyStatus;
      result.storyBaseName = generateData.storyBaseName || "story.pdf";
      if (generateData.error) {
        result.error = generateData.error;
      }

      // Call /api/query for image if imagePrompt is provided
      if (formData.imagePrompt.trim()) {
        const queryRes = await fetch("/api/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: formData.imagePrompt }),
        });
        if (!queryRes.ok)
          throw new Error(`HTTP error! Status: ${queryRes.status}`);
        const queryData = await queryRes.json();
        console.log("Query API Response:", queryData);

        if (queryData.image) {
          result.imageData = queryData.image;
          result.imageStatus = "Image generated successfully";
        } else if (queryData.error) {
          result.imageStatus = `Failed to generate image: ${queryData.error}`;
          result.error = result.error
            ? `${result.error}; Image error: ${queryData.error}`
            : queryData.error;
        }
      } else {
        result.imageStatus = "No image prompt provided";
      }

      // Browser-based text-to-speech and recording
      const ttsInput = formData.ttsPrompt || result.story;
      if (ttsInput) {
        try {
          console.log("TTS Input:", ttsInput); // Debug TTS input
          const utterance = new SpeechSynthesisUtterance(ttsInput);
          utterance.lang = "en-US";
          utterance.volume = 1;
          utterance.rate = 1;
          utterance.pitch = 1;

          // Request microphone permission to capture audio
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          streamRef.current = stream;
          mediaRecorderRef.current = new MediaRecorder(stream, {
            mimeType: "audio/webm",
          });
          audioChunksRef.current = [];

          mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
              console.log("Audio chunk size:", event.data.size); // Debug chunk size
            } else {
              console.log("Empty audio chunk received");
            }
          };

          mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, {
              type: "audio/webm",
            });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
              const base64String = reader.result.split(",")[1];
              const audioBaseName = "story_audio.webm";
              const updatedResult = {
                ...result,
                audioData: base64String,
                audioMimeType: "audio/webm",
                audioBaseName: audioBaseName,
                audioStatus: "Audio generated successfully",
              };
              setResults(updatedResult);
            };
            setIsRecording(false);
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((track) => track.stop());
              streamRef.current = null;
            }
          };

          mediaRecorderRef.current.onerror = (e) => {
            console.error("MediaRecorder error:", e);
            result.audioStatus = `Failed to generate audio: ${
              e.error?.message || "Unknown error"
            }`;
            setIsRecording(false);
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((track) => track.stop());
              streamRef.current = null;
            }
            setResults(result);
          };

          // Start recording
          setIsRecording(true);
          mediaRecorderRef.current.start();
          console.log("Recording started.");

          // Play speech
          utterance.onstart = () => {
            console.log("Speech synthesis started.");
          };

          utterance.onend = () => {
            console.log("Speech synthesis ended.");
            setTimeout(() => {
              if (
                mediaRecorderRef.current &&
                mediaRecorderRef.current.state === "recording"
              ) {
                mediaRecorderRef.current.stop();
                console.log("Recording stopped.");
              }
            }, 1000); // Delay to capture trailing audio
          };

          utterance.onerror = (e) => {
            console.error("Speech synthesis error:", e);
            result.audioStatus = `Failed to generate audio: ${
              e.error?.message || "Speech synthesis failed"
            }`;
            setResults(result);
            if (
              mediaRecorderRef.current &&
              mediaRecorderRef.current.state === "recording"
            ) {
              mediaRecorderRef.current.stop();
            }
            setIsRecording(false);
          };

          window.speechSynthesis.speak(utterance);
          console.log("Speech synthesis initiated.");
        } catch (e) {
          console.error("Audio generation error:", e);
          result.audioStatus = `Failed to generate audio: ${e.message}`;
          result.error = result.error
            ? `${result.error}; Audio error: ${e.message}`
            : e.message;
          setIsRecording(false);
          setResults(result);
        }
      } else {
        result.audioStatus = "No audio input provided";
        console.log("No valid audio input provided");
      }

      if (!result.story && !result.imageData && !result.audioData) {
        throw new Error("No valid data returned from APIs");
      }

      // Set initial results (audio will update later)
      setResults(result);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to generate content");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateAndDownloadPDF = (story, imageData) => {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Styling variables
      const marginLeft = 20;
      const marginTop = 20;
      const maxWidth = 170; // A4 width (210mm) - margins
      const lineHeight = 7;
      let currentY = marginTop;

      // Add title
      doc.setFont("times", "bold");
      doc.setFontSize(20);
      doc.setTextColor(75, 0, 130); // Indigo
      doc.text("Your Magical Story", marginLeft, currentY);
      currentY += 15;

      // Add story text
      const paragraphs = story.split("\n\n").filter((p) => p.trim());
      doc.setFont("times", "normal");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0); // Black

      paragraphs.forEach((paragraph) => {
        const lines = doc.splitTextToSize(paragraph.trim(), maxWidth);
        doc.text(lines, marginLeft, currentY);
        currentY += lines.length * lineHeight + 5; // Paragraph spacing
        if (currentY > 260) {
          doc.addPage();
          currentY = marginTop;
        }
      });

      // Add image if available
      if (imageData) {
        if (currentY > 200) {
          doc.addPage();
          currentY = marginTop;
        }
        const imgWidth = 150;
        const imgHeight = 150; // Assume square image for simplicity
        const imgX = (210 - imgWidth) / 2; // Center image
        doc.addImage(
          `data:image/png;base64,${imageData}`,
          "PNG",
          imgX,
          currentY,
          imgWidth,
          imgHeight
        );
      }

      // Trigger direct download
      doc.save("story.pdf");
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-black relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-32 left-20 w-72 h-72 bg-violet-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>

      {/* Floating sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12 transform hover:scale-105 transition-transform duration-300">
          <h1 className="text-6xl md:text-7xl font-bold mb-4 flex items-center justify-center space-x-2">
            <span className="text-yellow-300 animate-rotate">✨</span>
            <span className="bg-gradient-to-r from-purple-500 via-pink-300 to-indigo-300 bg-clip-text text-transparent">
              Story Creator
            </span>
            <span className="text-yellow-300 animate-rotate">✨</span>
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto mb-6 rounded-full"></div>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto leading-relaxed">
            Transform your imagination into magical stories, stunning visuals,
            and captivating audio experiences
          </p>
        </div>

        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

        {/* Main Form */}
        <form
          onSubmit={handleSubmit}
          className="backdrop-blur-md bg-white/5 border border-purple-500/20 rounded-3xl p-8 shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:border-purple-400/30"
        >
          {error && (
            <div className="bg-red-500/20 border border-red-400/50 text-red-100 p-4 rounded-xl mb-6 animate-shake">
              <div className="flex items-center">
                <span className="text-red-400 mr-2">⚠️</span>
                {error}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Story Section */}
            <div className="space-y-6 group">
              <div className="transform group-hover:translate-x-2 transition-transform duration-300">
                <label className="flex items-center text-xl font-semibold text-purple-200 mb-3">
                  <span className="mr-2">📖</span>
                  Story Prompt
                </label>
                <div className="relative">
                  <textarea
                    name="storyPrompt"
                    value={formData.storyPrompt}
                    onChange={handleInputChange}
                    placeholder="Write a magical bedtime story about brave knights, mystical creatures, or enchanted forests..."
                    className="w-full p-4 rounded-xl bg-gradient-to-br from-purple-800/50 to-indigo-800/50 backdrop-blur-xs border border-purple-500/50 text-white placeholder-purple-300/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 resize-none hover:border-purple-400/70 hover:shadow-lg hover:shadow-purple-500/20"
                    rows="5"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/10 to-pink-600/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>
            </div>

            {/* Media Section */}
            <div className="space-y-6 group">
              <div className="transform group-hover:translate-x-2 transition-transform duration-300">
                <label className="flex items-center text-xl font-semibold text-purple-200 mb-3">
                  <span className="mr-2">🎨</span>
                  Image Prompt
                </label>
                <div className="relative">
                  <textarea
                    name="imagePrompt"
                    value={formData.imagePrompt}
                    onChange={handleInputChange}
                    placeholder="A majestic unicorn in a moonlit garden, surrounded by glowing flowers and butterflies..."
                    className="w-full p-4 rounded-xl bg-gradient-to-br from-purple-800/50 to-indigo-800/50 backdrop-blur-xs border border-purple-500/50 text-white placeholder-purple-300/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 resize-none hover:border-purple-400/70 hover:shadow-lg hover:shadow-purple-500/20"
                    rows="4"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/10 to-pink-600/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>

              <div className="transform group-hover:translate-x-2 transition-transform duration-300 delay-100">
                <label className="flex items-center text-xl font-semibold text-purple-200 mb-3">
                  <span className="mr-2">🎵</span>
                  Audio Narration
                </label>
                <div className="relative">
                  <textarea
                    name="ttsPrompt"
                    value={formData.ttsPrompt}
                    onChange={handleInputChange}
                    placeholder="Customize your narration text or leave blank to use the generated story..."
                    className="w-full p-4 rounded-xl bg-gradient-to-br from-purple-800/50 to-indigo-800/50 backdrop-blur-xs border border-purple-500/50 text-white placeholder-purple-300/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 resize-none hover:border-purple-400/70 hover:shadow-lg hover:shadow-purple-500/20"
                    rows="3"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/10 to-pink-600/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-center">
            <button
              type="submit"
              disabled={loading || isRecording}
              className="group relative px-12 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white font-bold text-lg rounded-2xl hover:from-purple-500 hover:via-pink-500 hover:to-indigo-500 disabled:from-gray-600 disabled:via-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-2">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating Magic...</span>
                  </>
                ) : isRecording ? (
                  <>
                    <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                    <span>Recording Audio...</span>
                  </>
                ) : (
                  <>
                    <span>🪄</span>
                    <span>Create Magic</span>
                    <span>✨</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </form>

        {/* Results Section */}
        {results && (
          <div className="mt-12 space-y-8 animate-fade">
            {results.story && (
              <div className="group backdrop-blur-md bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-400/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:border-purple-300/50 transform hover:scale-[1.02]">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">📚</span>
                  <h3 className="text-2xl font-bold text-white">
                    Your Magical Story
                  </h3>
                </div>
                <div className="bg-black/20 rounded-xl p-4 mb-4">
                  <p className="text-purple-100 leading-relaxed text-lg">
                    {results.story}
                  </p>
                </div>
                <button
                  onClick={() =>
                    generateAndDownloadPDF(results.story, results.imageData)
                  }
                  className="group/btn inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-500 hover:to-pink-500 transform hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25"
                >
                  <span>📄</span>
                  <span>Download Story as PDF</span>
                  <div className="w-0 group-hover/btn:w-2 transition-all duration-300 overflow-hidden">
                    <span>→</span>
                  </div>
                </button>
              </div>
            )}

            {results.imageData && (
              <div className="group backdrop-blur-md bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-400/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:border-purple-300/50 transform hover:scale-[1.02]">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">🖼️</span>
                  <h3 className="text-2xl font-bold text-white">
                    Your Magical Image
                  </h3>
                </div>
                <div className="relative overflow-hidden rounded-xl mb-4 group/image">
                  <img
                    src={`data:image/png;base64,${results.imageData}`}
                    className="w-full max-w-md mx-auto rounded-xl shadow-2xl transform group-hover/image:scale-105 transition-transform duration-500"
                    alt="Generated Image"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300"></div>
                </div>
                <a
                  href={`data:image/png;base64,${results.imageData}`}
                  download="image.png"
                  className="group/btn inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transform hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/25"
                >
                  <span>📥</span>
                  <span>Download Image</span>
                  <div className="w-0 group-hover/btn:w-2 transition-all duration-300 overflow-hidden">
                    <span>→</span>
                  </div>
                </a>
              </div>
            )}

            {results.audioData && results.audioMimeType && (
              <div className="group backdrop-blur-md bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-400/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:border-purple-300/50 transform hover:scale-[1.02]">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">🎵</span>
                  <h3 className="text-2xl font-bold text-white">
                    Your Audio Story
                  </h3>
                </div>
                <div className="bg-black/20 rounded-xl p-4 mb-4">
                  <audio
                    controls
                    src={`data:${results.audioMimeType};base64,${results.audioData}`}
                    className="w-full max-w-md mx-auto rounded-lg"
                  />
                </div>
                <a
                  href={`data:${results.audioMimeType};base64,${results.audioData}`}
                  download={results.audioBaseName}
                  className="group/btn inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl hover:from-pink-500 hover:to-purple-500 transform hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/25"
                >
                  <span>📥</span>
                  <span>Download Audio</span>
                  <div className="w-0 group-hover/btn:w-2 transition-all duration-300 overflow-hidden">
                    <span>→</span>
                  </div>
                </a>
              </div>
            )}

            {results.error && (
              <div className="backdrop-blur-md bg-red-900/40 border border-red-400/50 text-red-100 p-6 rounded-2xl animate-shake">
                <div className="flex items-center">
                  <span className="text-red-400 mr-3 text-xl">⚠️</span>
                  <p className="text-lg">{results.error}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }
        .animate-rotate {
          animation: rotate 3s linear infinite;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
