import React, { useState, useRef, useEffect } from "react";
import { BASE_URL } from "../../../url";
import { Loader } from "../Loader";
import Confirmation from "../Confirmation";
import { barakhdi } from "../../data/barakhadi_hindi";
import { words } from "../../data/words_hindi";
import { shlok } from "../../data/shlok_hindi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const AudioRecorder = () => {
  const [category, setCategory] = useState("barakhdi");
  const [recording, setRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);
  const [audioURL, setAudioURL] = useState(null);
  const [uploaded, setUploaded] = useState(false);
  const [response, setResponse] = useState("No Data");
  const [modelLoaded, setModelLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [currentCardId, setCurrentCardId] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const mediaStreamRef = useRef(null);

  let categoryData;
  switch (category) {
    case "barakhdi":
      categoryData = barakhdi;
      break;
    case "words":
      categoryData = words;
      break;
    case "shlok":
      categoryData = shlok;
      break;
    default:
      categoryData = barakhdi;
  }

  useEffect(() => {
    // Simulating the hindi model loading
    const modelLoadingTimeout = setTimeout(() => {
      setModelLoaded(true);
    }, 20000);

    return () => clearTimeout(modelLoadingTimeout);
  }, []);

  const startRecording = async () => {
    setAudioChunks([]);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      mediaStreamRef.current = mediaStream;
      const mediaRecorder = new MediaRecorder(mediaStream);
      mediaRecorder.ondataavailable = handleDataAvailable;
      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      setRecording(false);
    }
  };

  const handleDataAvailable = (event) => {
    if (event.data.size > 0) {
      setAudioChunks([...audioChunks, event.data]);
    }
  };

  const handlePlay = () => {
    if (audioChunks.length === 0) {
      console.warn("No audio data recorded.");
      return;
    }

    const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
    const url = URL.createObjectURL(audioBlob);
    setAudioURL(url);

    const audio = new Audio(url);
    audio.play().catch((error) => {
      console.error("Error playing audio:", error);
    });
  };

  const uploadBlob = async () => {
    console.log(barakhdi[currentCardIndex].id);
    if (audioChunks.length === 0) {
      console.warn("No audio data recorded.");
      return;
    }

    setUploading(true);

    const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
    const formData = new FormData();
    formData.append("audio_data", audioBlob, "recorded_audio.wav");
    formData.append("type", "wav");

    try {
      const apiUrl = `${BASE_URL}/process_hindi`;
      const response = await fetch(apiUrl, {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        body: formData,
      });
      const responseData = await response.json();
      console.log("Audio uploaded successfully:", responseData);

      const stringToCheck = JSON.stringify(
        responseData.text.replace(/<s>/g, "")
      )
        .replace(/\s/g, "")
        .replace(/^"(.*)"$/, "$1");

      setResponse(stringToCheck);
      console.log("Outside ", stringToCheck);
      console.log("Outside ", categoryData[currentCardIndex].hindi);
      console.log(
        "Outside ",
        stringToCheck == categoryData[currentCardIndex].hindi
      );

      if (stringToCheck == categoryData[currentCardIndex].hindi) {
        console.log("Inside ", stringToCheck);
        console.log(stringToCheck);
        toast.success("Great Job!");
        setTimeout(() => {
          setCurrentCardIndex(currentCardIndex + 1);
          resetState();
        }, 3000);
      } else {
        toast.error("Please try again");
        resetState();
      }

      setUploaded(true);
    } catch (error) {
      console.error("Error uploading audio:", error);
      setAudioChunks([]);
    } finally {
      setUploading(false);
    }
  };

  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
    setCurrentCardIndex(0);
  };

  const resetState = () => {
    setRecording(false);
    setAudioChunks([]);
    setAudioURL(null);
    setUploaded(false);
    setResponse("No Data");
    setModelLoaded(false);
    setUploading(false);
    setShowConfirmationDialog(false);
    setCurrentCardId(null);
  };

  const handleConfirmation = () => {
    resetState();
  };

  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center min-h-screen py-8">
        <h1 className="text-4xl font-bold mb-4 text-purple-700 md:text-5xl">
          hindi उपशक्
        </h1>
        <ToastContainer />
        <div className="mb-4">
          <label htmlFor="category" className="mr-2 font-semibold">
            Choose a category:
          </label>
          <select
            id="category"
            value={category}
            onChange={handleCategoryChange}
            className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 sm:text-lg"
          >
            <option value="barakhdi">Basic</option>
            <option value="words">Intermediate</option>
            <option value="shlok">Advance</option>
          </select>
        </div>
        <div className="card bg-white rounded-lg shadow-md p-6 md:p-8 mb-6 max-w-3xl w-full md:w-2/3 lg:w-1/2">
          <div className="text-4xl md:text-6xl font-bold mb-6 md:mb-8 text-center">
            {categoryData[currentCardIndex].hindi}
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <div className="pronunciation text-base md:text-lg mb-2 md:mb-0">
              <span className="font-semibold">Pronunciation:</span>{" "}
              {categoryData[currentCardIndex].pronunciation}
            </div>
            {categoryData[currentCardIndex].meaning ? (
              <div className="meaning text-base md:text-lg">
                <span className="font-semibold">Meaning:</span>{" "}
                {categoryData[currentCardIndex].meaning}
              </div>
            ) : (
              " "
            )}
          </div>
        </div>
        <div className="button_container flex flex-wrap justify-center mb-4">
          <button
            onClick={startRecording}
            disabled={recording || uploaded}
            className="bg-purple-500 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded mb-2 w-full sm:w-auto sm:mr-2 disabled:opacity-50 disabled:cursor-not-allowed sm:text-lg"
          >
            Start Recording
          </button>
          <button
            onClick={stopRecording}
            disabled={!recording || uploaded}
            className="bg-purple-500 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded mb-2 w-full sm:w-auto sm:mr-2 disabled:opacity-50 disabled:cursor-not-allowed sm:text-lg"
          >
            Stop Recording
          </button>
          <button
            onClick={uploadBlob}
            disabled={audioChunks.length === 0 || uploaded || recording}
            className="bg-purple-500 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded mb-2 w-full sm:w-auto sm:mr-2 disabled:opacity-50 disabled:cursor-not-allowed sm:text-lg"
          >
            Upload Audio
          </button>
          <button
            onClick={handlePlay}
            disabled={!uploaded || recording}
            className="bg-purple-500 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded mb-2 w-full sm:w-auto sm:mr-2 disabled:opacity-50 disabled:cursor-not-allowed sm:text-lg"
          >
            Play Recorded Audio
          </button>
          <button
            onClick={() => setShowConfirmationDialog(true)}
            disabled={!uploaded || recording}
            className="bg-red-500 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded mb-2 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed sm:text-lg"
          >
            Reset
          </button>
        </div>
        {uploaded && (
          <p className="text-green-500 sm:text-lg">
            Audio uploaded successfully!
          </p>
        )}
        {audioURL && (
          <audio controls src={audioURL} className="mb-4 sm:w-1/2"></audio>
        )}
        <h2 className="text-lg font-semibold sm:text-xl">{response}</h2>

        {showConfirmationDialog && (
          <Confirmation
            handleConfirmation={handleConfirmation}
            setShowConfirmationDialog={setShowConfirmationDialog}
          />
        )}
        {uploading && <Loader />}
      </div>
      <Footer />
    </>
  );
};

export default AudioRecorder;
